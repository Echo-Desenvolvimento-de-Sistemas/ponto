<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetTicket;
use Illuminate\Http\Request;

class PasswordResetTicketController extends Controller
{
    /**
     * Empresa envia um ticket de recuperação de senha para o admin global.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'nome_empresa' => 'required|string|max:255',
            'mensagem' => 'nullable|string|max:1000',
        ]);

        $ticket = PasswordResetTicket::create($validated);

        return response()->json([
            'message' => 'Ticket enviado com sucesso. O administrador do sistema entrará em contato.',
            'data' => $ticket
        ], 201);
    }

    /**
     * Admin global lista os tickets pendentes.
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin_global') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tickets = PasswordResetTicket::orderBy('created_at', 'desc')->get();

        return response()->json($tickets);
    }
}
