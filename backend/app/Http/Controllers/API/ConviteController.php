<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ConviteEmpresa;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class ConviteController extends Controller
{
    /**
     * Generate a new invitation token for a given company (Admin Global Only)
     */
    public function gerar(Request $request)
    {
        if ($request->user()->role !== 'admin_global') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'empresa_id' => 'required|exists:empresas,id'
        ]);

        $token = Str::random(40);

        $convite = ConviteEmpresa::create([
            'empresa_id' => $request->empresa_id,
            'token' => $token,
            'expires_at' => Carbon::now()->addDays(7), // Link expires in 7 days
        ]);

        return response()->json([
            'message' => 'Convite gerado com sucesso.',
            'link' => url("/setup/{$token}") // Frontend route that will handle this
        ]);
    }

    /**
     * Validate an invitation token (Public)
     */
    public function validar($token)
    {
        $convite = ConviteEmpresa::with('empresa')->where('token', $token)->first();

        if (!$convite) {
            return response()->json(['message' => 'Convite inválido ou não encontrado.'], 404);
        }

        if ($convite->usado) {
            return response()->json(['message' => 'Este convite já foi utilizado.'], 400);
        }

        if (Carbon::now()->isAfter($convite->expires_at)) {
            return response()->json(['message' => 'Este convite expirou.'], 400);
        }

        return response()->json([
            'valido' => true,
            'empresa' => $convite->empresa->only(['id', 'nome_fantasia'])
        ]);
    }

    /**
     * Process an invitation token and register the initial admin user (Public)
     */
    public function aceitar(Request $request, $token)
    {
        $convite = ConviteEmpresa::where('token', $token)->first();

        if (!$convite || $convite->usado || Carbon::now()->isAfter($convite->expires_at)) {
            return response()->json(['message' => 'Convite inválido ou expirado.'], 400);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create the company's first RH/Admin user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'empresa_id' => $convite->empresa_id,
            'role' => 'empresa_rh', // Main tenant admin role
        ]);

        // Mark token as used
        $convite->update(['usado' => true]);

        // Automatically log them in by returning a Sanctum token
        $authToken = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Conta criada com sucesso!',
            'access_token' => $authToken,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }
}
