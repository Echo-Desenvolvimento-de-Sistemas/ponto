<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JornadaTrabalho;
use Illuminate\Http\Request;

class MinhaJornadaController extends Controller
{
    /**
     * Retorna a jornada de trabalho vinculada ao funcionário logado.
     * Prioridade: jornada do funcionário via detalhes, senão a primeira da empresa.
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('detalhes');

        // Se o funcionário tiver uma jornada específica no detalhe
        $jornada = null;
        if ($user->detalhes?->jornada_id) {
            $jornada = JornadaTrabalho::find($user->detalhes->jornada_id);
        }

        // Fallback: primeira jornada da empresa
        if (!$jornada && $user->empresa_id) {
            $jornada = JornadaTrabalho::where('empresa_id', $user->empresa_id)->first();
        }

        if (!$jornada) {
            return response()->json([
                'descricao' => 'Jornada Padrão',
                'horario_entrada' => '08:00',
                'horario_saida' => '18:00',
                'intervalo_inicio' => $user->detalhes?->intervalo_inicio ?? '12:00',
                'intervalo_fim' => $user->detalhes?->intervalo_fim ?? '13:00',
                'tolerancia_minutos' => 10,
            ]);
        }

        // Aplica horários de almoço customizados específicos do funcionário, se existirem
        if ($user->detalhes) {
            if ($user->detalhes->intervalo_inicio) {
                $jornada->intervalo_inicio = $user->detalhes->intervalo_inicio;
            }
            if ($user->detalhes->intervalo_fim) {
                $jornada->intervalo_fim = $user->detalhes->intervalo_fim;
            }
        }

        return response()->json($jornada);
    }
}
