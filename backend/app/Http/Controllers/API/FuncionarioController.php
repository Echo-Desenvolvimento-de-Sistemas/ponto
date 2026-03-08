<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\FuncionarioDetalhe;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FuncionarioController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $funcionarios = User::with('detalhes')
            ->where('empresa_id', $request->user()->empresa_id)
            ->where('role', 'funcionario')
            ->get();

        return response()->json($funcionarios);
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'pis' => 'nullable|string|max:255',
            'cpf' => 'required|string|max:255|unique:funcionario_detalhes,cpf',
            'matricula' => 'nullable|string|max:255',
            'cargo' => 'nullable|string|max:255',
            'data_admissao' => 'nullable|date',
            'regime_contratacao' => 'required|in:CLT,PJ,Estágio,Temporário',
            'jornada_id' => 'nullable|exists:jornada_trabalhos,id',
            'intervalo_inicio' => 'nullable|date_format:H:i',
            'intervalo_fim' => 'nullable|date_format:H:i',
        ]);

        DB::beginTransaction();

        try {
            $user = User::create([
                'empresa_id' => $request->user()->empresa_id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'funcionario',
            ]);

            $setupToken = Str::random(40);

            $detalhes = FuncionarioDetalhe::create([
                'user_id' => $user->id,
                'jornada_id' => $validated['jornada_id'] ?? null,
                'pis' => $validated['pis'] ?? null,
                'cpf' => $validated['cpf'],
                'matricula' => $validated['matricula'] ?? null,
                'cargo' => $validated['cargo'] ?? null,
                'data_admissao' => $validated['data_admissao'] ?? null,
                'regime_contratacao' => $validated['regime_contratacao'] ?? 'CLT',
                'intervalo_inicio' => $validated['intervalo_inicio'] ?? null,
                'intervalo_fim' => $validated['intervalo_fim'] ?? null,
                'setup_token' => $setupToken,
            ]);

            DB::commit();

            return response()->json($user->load('detalhes'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating resource: ' . $e->getMessage()], 500);
        }
    }

    public function show(Request $request, User $funcionario)
    {
        if ($funcionario->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($funcionario->load('detalhes'));
    }

    public function update(Request $request, User $funcionario)
    {
        if ($request->user()->role === 'funcionario' || $funcionario->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $funcionario->id,
            'password' => 'nullable|string|min:8',
            'pis' => 'nullable|string|max:255',
            'cpf' => 'sometimes|string|max:255|unique:funcionario_detalhes,cpf,' . ($funcionario->detalhes ? $funcionario->detalhes->id : 'NULL'),
            'matricula' => 'nullable|string|max:255',
            'cargo' => 'nullable|string|max:255',
            'data_admissao' => 'nullable|date',
            'regime_contratacao' => 'sometimes|in:CLT,PJ,Estágio,Temporário',
            'jornada_id' => 'nullable|exists:jornada_trabalhos,id',
            'intervalo_inicio' => 'nullable|date_format:H:i',
            'intervalo_fim' => 'nullable|date_format:H:i',
        ]);

        DB::beginTransaction();

        try {
            if (isset($validated['name']))
                $funcionario->name = $validated['name'];
            if (isset($validated['email']))
                $funcionario->email = $validated['email'];
            if (!empty($validated['password']))
                $funcionario->password = Hash::make($validated['password']);

            $funcionario->save();

            $detalhesData = [];
            if (array_key_exists('jornada_id', $validated))
                $detalhesData['jornada_id'] = $validated['jornada_id'];
            if (array_key_exists('pis', $validated))
                $detalhesData['pis'] = $validated['pis'];
            if (array_key_exists('cpf', $validated))
                $detalhesData['cpf'] = $validated['cpf'];
            if (array_key_exists('matricula', $validated))
                $detalhesData['matricula'] = $validated['matricula'];
            if (array_key_exists('pis', $validated))
                $detalhesData['pis'] = $validated['pis'];
            if (array_key_exists('cargo', $validated))
                $detalhesData['cargo'] = $validated['cargo'];
            if (array_key_exists('data_admissao', $validated))
                $detalhesData['data_admissao'] = $validated['data_admissao'];
            if (array_key_exists('regime_contratacao', $validated))
                $detalhesData['regime_contratacao'] = $validated['regime_contratacao'];
            if (array_key_exists('intervalo_inicio', $validated))
                $detalhesData['intervalo_inicio'] = $validated['intervalo_inicio'];
            if (array_key_exists('intervalo_fim', $validated))
                $detalhesData['intervalo_fim'] = $validated['intervalo_fim'];

            if (!empty($detalhesData)) {
                if ($funcionario->detalhes) {
                    $funcionario->detalhes->update($detalhesData);
                } else {
                    $detalhesData['user_id'] = $funcionario->id;
                    FuncionarioDetalhe::create($detalhesData);
                }
            }

            // Registrar Log de Auditoria
            AuditLog::create([
                'empresa_id' => $funcionario->empresa_id,
                'user_id' => $request->user()->id,
                'acao' => 'update',
                'model_type' => 'App\Models\User',
                'model_id' => $funcionario->id,
                'dados_antigos' => $funcionario->getOriginal(),
                'dados_novos' => $funcionario->getChanges(),
                'ip_address' => $request->ip()
            ]);

            DB::commit();

            return response()->json($funcionario->load('detalhes'), 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating resource: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, User $funcionario)
    {
        if ($request->user()->role === 'funcionario' || $funcionario->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $funcionario->delete();

        return response()->json(null, 204);
    }

    public function forcePasswordReset(Request $request, $id)
    {
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'password' => 'required|string|min:6'
        ]);

        $funcionario = User::where('empresa_id', $request->user()->empresa_id)
            ->findOrFail($id);

        $funcionario->password = Hash::make($request->password);
        $funcionario->must_change_password = true;
        $funcionario->save();

        ob_start();
        // Destruir sessões ou tokens atuais do usuário para forçar re-login
        $funcionario->tokens()->delete();
        ob_end_clean();

        // Registrar Log de Auditoria
        AuditLog::create([
            'empresa_id' => $funcionario->empresa_id,
            'user_id' => $request->user()->id,
            'acao' => 'update',
            'model_type' => 'App\Models\User',
            'model_id' => $funcionario->id,
            'dados_antigos' => ['password' => '***', 'must_change_password' => false],
            'dados_novos' => ['message' => 'Senha redefinida forçadamente pelo RH', 'must_change_password' => true],
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'Senha redefinida com sucesso pelo RH.'
        ]);
    }
}
