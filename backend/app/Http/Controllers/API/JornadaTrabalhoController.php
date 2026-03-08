<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JornadaTrabalho;
use Illuminate\Http\Request;

class JornadaTrabalhoController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(JornadaTrabalho::where('empresa_id', $request->user()->empresa_id)->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'descricao' => 'required|string|max:255',
            'horario_entrada' => 'required|date_format:H:i',
            'horario_saida' => 'required|date_format:H:i',
            'intervalo_inicio' => 'nullable|date_format:H:i',
            'intervalo_fim' => 'nullable|date_format:H:i',
            'tolerancia_minutos' => 'required|integer|min:0',
        ]);

        $validated['empresa_id'] = $request->user()->empresa_id;

        $jornada = JornadaTrabalho::create($validated);

        return response()->json($jornada, 201);
    }

    public function show(Request $request, JornadaTrabalho $jornada)
    {
        if ($jornada->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($jornada);
    }

    public function update(Request $request, JornadaTrabalho $jornada)
    {
        if ($jornada->empresa_id !== $request->user()->empresa_id || $request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'descricao' => 'sometimes|string|max:255',
            'horario_entrada' => 'sometimes|date_format:H:i',
            'horario_saida' => 'sometimes|date_format:H:i',
            'intervalo_inicio' => 'nullable|date_format:H:i',
            'intervalo_fim' => 'nullable|date_format:H:i',
            'tolerancia_minutos' => 'sometimes|integer|min:0',
        ]);

        // Fix potential seconds passing causing format bug
        foreach (['horario_entrada', 'horario_saida', 'intervalo_inicio', 'intervalo_fim'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = substr($validated[$field], 0, 5); // Keep only HH:mm
            }
        }

        $jornada->update($validated);

        return response()->json($jornada);
    }

    public function destroy(Request $request, JornadaTrabalho $jornada)
    {
        if ($jornada->empresa_id !== $request->user()->empresa_id || $request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jornada->delete();

        return response()->json(null, 204);
    }
}
