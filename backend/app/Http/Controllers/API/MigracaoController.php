<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MigracaoController extends Controller
{
    /**
     * Parse the uploaded JSON file and return a preview of valid users.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'file' => 'required|file|mimetypes:application/json,text/plain'
        ]);

        $empresaId = $request->input('empresa_id');
        $fileContent = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($fileContent, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['error' => 'Arquivo JSON inválido.'], 400);
        }

        if (!isset($data['users']) || !is_array($data['users'])) {
            return response()->json(['error' => 'Formato de JSON inválido. A chave "users" não foi encontrada.'], 400);
        }

        $validRoles = ['professor', 'secretaria'];
        $previewUsers = [];

        foreach ($data['users'] as $index => $userNode) {
            // Only process allowed roles
            if (!isset($userNode['role']) || !in_array($userNode['role'], $validRoles)) {
                continue;
            }

            $errors = [];

            // Basic field validation
            if (empty($userNode['name'])) {
                $errors[] = 'Nome obrigatório ausente.';
            }

            if (empty($userNode['email'])) {
                $errors[] = 'E-mail obrigatório ausente.';
            } elseif (!filter_var($userNode['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Formato de e-mail inválido.';
            } else {
                // Check for duplicates in the specific tenant
                $exists = User::where('empresa_id', $empresaId)
                    ->where('email', $userNode['email'])
                    ->exists();
                if ($exists) {
                    // Use a specific format to let frontend know it's a structural warning vs blocking error
                    $errors[] = 'E-mail já cadastrado nesta empresa.';
                }
            }

            $previewUsers[] = [
                'original_index' => $index,
                'external_id' => $userNode['external_id'] ?? null,
                'name' => $userNode['name'] ?? '',
                'email' => $userNode['email'] ?? '',
                'role' => $userNode['role'],
                'errors' => $errors
            ];
        }

        return response()->json([
            'message' => 'Preview gerado com sucesso.',
            'users' => $previewUsers
        ]);
    }

    /**
     * Import the selected users into the database.
     */
    public function importar(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('CHEGOU NA IMPORTAÇÃO', $request->all());

        $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'default_password' => 'required|string|min:6',
            'users' => 'required|array',
            'users.*.name' => 'required|string',
            'users.*.email' => 'required|email',
            'users.*.role' => 'required|in:professor,secretaria'
        ]);

        $empresaId = $request->empresa_id;
        $usersToImport = $request->users;
        $defaultPassword = Hash::make($request->default_password);

        try {
            DB::beginTransaction();

            $importedCount = 0;
            $failedUsers = [];

            foreach ($usersToImport as $index => $userData) {
                // Final hard check to prevent duplicates inside the transaction
                $exists = User::where('empresa_id', $empresaId)
                    ->where('email', $userData['email'])
                    ->exists();

                if ($exists) {
                    $failedUsers[] = "{$userData['email']} já existe.";
                    continue; // Or throw to rollback the whole thing depending on preference. We'll throw to be atomic as requested.
                }

                // We must map 'professor' and 'secretaria' to 'funcionario' role since the schema enum
                // is restricted to ['admin_global', 'empresa_rh', 'funcionario'].
                $roleEnum = 'funcionario';

                $user = User::create([
                    'empresa_id' => $empresaId,
                    'name' => $userData['name'],
                    'email' => $userData['email'],
                    'password' => $defaultPassword,
                    'role' => $roleEnum,
                    'must_change_password' => true,
                ]);

                // Create FuncionarioDetalhe with a mocked unique CPF so it doesn't break DB constraints.
                // Admin can edit this later.
                \App\Models\FuncionarioDetalhe::create([
                    'user_id' => $user->id,
                    'cpf' => 'MIGRADO' . $user->id . rand(1000, 9999),
                    'cargo' => $userData['role'],
                    'regime_contratacao' => 'CLT',
                    'setup_token' => \Illuminate\Support\Str::random(40),
                ]);

                $importedCount++;
            }

            // Atomic rollback if even one fails due to duplicate (since preview should have caught it, this is a safety net)
            if (count($failedUsers) > 0) {
                DB::rollBack();
                return response()->json([
                    'error' => 'Importação cancelada. Erros encontrados durante o insert final.',
                    'details' => $failedUsers
                ], 422);
            }

            DB::commit();

            return response()->json([
                'message' => "Importação concluída com sucesso. $importedCount usuários cadastrados.",
                'imported_count' => $importedCount
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Erro na migração JSON: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'error' => 'Erro crítico ao importar os dados. Nenhuma alteração foi salva.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
