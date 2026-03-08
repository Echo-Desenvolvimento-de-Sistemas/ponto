<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FuncionarioDetalhe;
use Illuminate\Support\Facades\Hash;

class SetupColaboradorController extends Controller
{
    /**
     * Validate the employee setup token.
     */
    public function validar($token)
    {
        $detalhe = FuncionarioDetalhe::with('user.empresa')->where('setup_token', $token)->first();

        if (!$detalhe) {
            return response()->json(['message' => 'Convite inválido ou expirado.'], 404);
        }

        return response()->json([
            'valido' => true,
            'user' => [
                'name' => $detalhe->user->name,
                'email' => $detalhe->user->email,
            ],
            'empresa' => $detalhe->user->empresa->nome_fantasia ?? $detalhe->user->empresa->razao_social
        ]);
    }

    /**
     * Complete the employee registration.
     */
    public function aceitar(Request $request, $token)
    {
        $detalhe = FuncionarioDetalhe::with('user')->where('setup_token', $token)->first();

        if (!$detalhe) {
            return response()->json(['message' => 'Convite inválido ou expirado.'], 404);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $detalhe->user;
        $user->password = Hash::make($validated['password']);
        $user->save();

        // Clear the token so it can't be used again
        $detalhe->setup_token = null;
        $detalhe->save();

        // Automatically log them in by returning a Sanctum token
        $authToken = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Cadastro finalizado com sucesso!',
            'access_token' => $authToken,
            'token_type' => 'Bearer',
            'user' => $user->load('detalhes')
        ], 200);
    }
}
