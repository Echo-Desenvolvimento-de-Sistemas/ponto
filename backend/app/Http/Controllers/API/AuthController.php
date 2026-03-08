<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\FuncionarioDetalhe;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',  // aceita e-mail ou CPF
            'password' => 'required',
        ]);

        $identifier = $request->login;

        // Tenta encontrar por e-mail primeiro
        if (str_contains($identifier, '@')) {
            $user = User::where('email', $identifier)->first();
        } else {
            // Remove formatação do CPF (pontos e traço)
            $cpfLimpo = preg_replace('/\D/', '', $identifier);
            $detalhe = FuncionarioDetalhe::where('cpf', $cpfLimpo)
                ->orWhere('cpf', $identifier)
                ->first();
            $user = $detalhe ? $detalhe->user : null;
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciais inválidas.'], 401);
        }

        if ($user->must_change_password) {
            // Emite um token temporário com menos escopo se necessário, 
            // ou apenas avisa o front para trocar a senha usando o token emitido
            $token = $user->createToken('auth_token', ['password-reset'])->plainTextToken;
            return response()->json([
                'require_password_change' => true,
                'message' => 'Você precisa redefinir sua senha para continuar.',
                'access_token' => $token,
                'user' => $user->load('empresa')
            ], 403);
        }

        $token = $user->createToken('auth_token', ['*'])->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('empresa')
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->load('empresa', 'detalhes.jornada'));
    }

    public function changePasswordForced(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'A senha provisória informada está incorreta.'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->must_change_password = false;
        $user->save();

        // Destroi todos os tokens
        $user->tokens()->delete();

        // Faz login real novamente gerando token completo
        $token = $user->createToken('auth_token', ['*'])->plainTextToken;

        return response()->json([
            'message' => 'Senha alterada com sucesso!',
            'access_token' => $token,
            'user' => $user->load('empresa')
        ]);
    }
}
