<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RegistroPonto;
use App\Models\EspelhoAssinatura;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class RelatorioController extends Controller
{
    /**
     * Dashboard de Absenteísmo (Faltas, Atrasos, Horas Extras)
     */
    public function absenteismo(Request $request)
    {
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $mes = $request->query('mes', date('m'));
        $ano = $request->query('ano', date('Y'));
        $empresaId = $request->user()->empresa_id;

        $startDate = Carbon::createFromDate($ano, $mes, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Total de funcionarios
        $totalFuncionarios = User::where('empresa_id', $empresaId)->where('role', 'funcionario')->count();

        // Buscar todos os pontos deste mês
        $pontos = RegistroPonto::where('empresa_id', $empresaId)
            ->whereBetween('horario_dispositivo', [$startDate, $endDate])
            ->get();

        // Agregando por dia (Dias Trabalhados Totais)
        $diasUnicosTrabalhados = $pontos->pluck('horario_dispositivo')->map(function ($date) {
            return $date->format('Y-m-d');
        })->unique();

        $dadosGrafico = [];
        $diasDoMes = $startDate->daysInMonth;

        for ($i = 1; $i <= $diasDoMes; $i++) {
            $diaObj = $startDate->copy()->addDays($i - 1);
            if ($diaObj->isFuture()) {
                break;
            }

            $dataAtual = $diaObj->format('Y-m-d');

            // Quantos funcionarios unicos bateram ponto nesse dia
            $presentes = $pontos->filter(function ($p) use ($dataAtual) {
                return $p->horario_dispositivo->format('Y-m-d') === $dataAtual;
            })->unique('user_id')->count();

            $faltas = max(0, $totalFuncionarios - $presentes);

            // Evitar contabilizar faltas pesadas nos finais de semana para gráficos simples (opcional, vamos contar todos aqui, RH lida depois)
            $isWeekend = $startDate->copy()->addDays($i - 1)->isWeekend();

            $dadosGrafico[] = [
                'dia' => $i,
                'data' => $dataAtual,
                'presentes' => $isWeekend ? 0 : $presentes,
                'faltas' => $isWeekend ? 0 : $faltas,
            ];
        }

        return response()->json([
            'resumo' => [
                'total_funcionarios' => $totalFuncionarios,
                'media_presenca' => $totalFuncionarios > 0 ? round($diasUnicosTrabalhados->count() / max(1, count($diasUnicosTrabalhados)) * 100, 1) : 0,
            ],
            'grafico_diario' => $dadosGrafico
        ]);
    }

    /**
     * Espelho de Ponto Individual Mensal
     */
    public function espelho(Request $request, $userId)
    {
        if ($request->user()->role === 'funcionario' && $request->user()->id != $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $mes = $request->query('mes', date('m'));
        $ano = $request->query('ano', date('Y'));

        $user = User::with('detalhes', 'empresa')->findOrFail($userId);

        if ($request->user()->role !== 'admin_global' && $user->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $startDate = Carbon::createFromDate($ano, $mes, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $pontos = RegistroPonto::where('user_id', $userId)
            ->whereBetween('horario_dispositivo', [$startDate, $endDate])
            ->orderBy('horario_dispositivo', 'asc')
            ->get();

        // Agrupar por dia
        $dias = [];
        $diasDoMes = $startDate->daysInMonth;

        for ($i = 1; $i <= $diasDoMes; $i++) {
            $dataAtual = $startDate->copy()->addDays($i - 1);
            $dateStr = $dataAtual->format('Y-m-d');

            $pontosDoDia = $pontos->filter(function ($p) use ($dateStr) {
                return $p->horario_dispositivo->format('Y-m-d') === $dateStr;
            });

            // Organizar pontos pelo horário
            $pontosDoDia = $pontosDoDia->sortBy('horario_dispositivo')->values();

            $registros = [];
            foreach ($pontosDoDia as $p) {
                $registros[] = [
                    'tipo' => $p->tipo,
                    'hora' => $p->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('H:i')
                ];
            }

            $dias[] = [
                'data' => $dateStr,
                'dia_semana' => $dataAtual->locale('pt_BR')->translatedFormat('l'),
                'is_fim_semana' => $dataAtual->isWeekend(),
                'registros' => $registros,
                'horas_trabalhadas' => self::calcularHorasDia($pontosDoDia, $user->detalhes?->jornada),
                'adicional_noturno' => self::calcularAdicionalNoturno($pontosDoDia),
            ];
        }

        $assinatura = EspelhoAssinatura::where('user_id', $userId)
            ->where('mes', $mes)
            ->where('ano', $ano)
            ->first();

        return response()->json([
            'funcionario' => [
                'nome' => $user->name,
                'cargo' => $user->detalhes->cargo ?? 'Não Informado',
                'cpf' => $user->detalhes->cpf ?? 'Não Informado',
                'pis' => $user->detalhes->pis ?? 'Não Informado',
                'admissao' => $user->detalhes->data_admissao ?? null,
            ],
            'empresa' => [
                'razao_social' => $user->empresa->razao_social,
                'cnpj' => $user->empresa->cnpj,
                'logo' => $user->empresa->logo,
            ],
            'periodo' => [
                'mes' => str_pad($mes, 2, '0', STR_PAD_LEFT),
                'ano' => $ano
            ],
            'dias' => $dias,
            'assinatura' => $assinatura
        ]);
    }

    private static function calcularHorasDia($pontos, $jornada = null)
    {
        if ($pontos->isEmpty())
            return '00:00';

        $totalMinutos = 0;
        $entradaAtual = null;

        $pontos = $pontos->sortBy('horario_dispositivo')->values();

        foreach ($pontos as $p) {
            $horario = \Carbon\Carbon::parse($p->horario_dispositivo);

            if ($p->tipo === 'entrada' || $p->tipo === 'fim_intervalo') {
                $entradaAtual = $horario;
            } elseif (($p->tipo === 'saida' || $p->tipo === 'inicio_intervalo') && $entradaAtual) {
                $totalMinutos += $entradaAtual->diffInMinutes($horario);
                $entradaAtual = null;
            }
        }

        // Handle open shift crossing midnight (Night Shift check)
        if ($entradaAtual && $jornada && ($jornada->is_noturna || $jornada->escala_tipo === '12x36')) {
            // If it's a night shift, we might find the 'saida' on the NEXT day
            // This version of the function is day-based. For full accuracy, 
            // a session-based calculation across day boundaries is preferred.
        }

        $horas = floor($totalMinutos / 60);
        $mins = $totalMinutos % 60;

        return sprintf('%02d:%02d', $horas, $mins);
    }

    /**
     * Calculates Night Shift Premium (22h to 05h)
     */
    private static function calcularAdicionalNoturno($pontos)
    {
        $minutosNoturnos = 0;
        $entradaAtual = null;

        foreach ($pontos as $p) {
            $horario = \Carbon\Carbon::parse($p->horario_dispositivo);

            if ($p->tipo === 'entrada' || $p->tipo === 'fim_intervalo') {
                $entradaAtual = $horario;
            } elseif (($p->tipo === 'saida' || $p->tipo === 'inicio_intervalo') && $entradaAtual) {
                $saida = $horario;

                // Check intersection with [22h - 05h]
                $inicioNoturno = $entradaAtual->copy()->startOfDay()->addHours(22);
                $fimNoturno = $entradaAtual->copy()->startOfDay()->addDays(1)->addHours(5);

                // This is a simplified overlap calculation for Brazil laws
                $overlapStart = $entradaAtual->gt($inicioNoturno) ? $entradaAtual : $inicioNoturno;
                $overlapEnd = $saida->lt($fimNoturno) ? $saida : $fimNoturno;

                if ($overlapStart->lt($overlapEnd)) {
                    $minutosNoturnos += $overlapStart->diffInMinutes($overlapEnd);
                }

                $entradaAtual = null;
            }
        }

        if ($minutosNoturnos === 0)
            return '00:00';

        // Conversion: 52.5 mins = 1 hour noturna
        $minutosReais = ($minutosNoturnos / 52.5) * 60;

        $horas = floor($minutosReais / 60);
        $mins = round($minutosReais % 60);

        return sprintf('%02d:%02d', $horas, $mins);
    }

    public function assinarEspelho(Request $request, $userId)
    {
        $request->validate([
            'mes' => 'required|integer|between:1,12',
            'ano' => 'required|integer',
        ]);

        $user = $request->user();

        // Só o próprio funcionário ou admin/rh da empresa podem assinar (geralmente só o func assina, mas p/ flexibilidade)
        if ($user->role === 'funcionario' && $user->id != $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::findOrFail($userId);
        if ($user->role !== 'admin_global' && $user->empresa_id !== $targetUser->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $mes = $request->input('mes');
        $ano = $request->input('ano');

        // Verifica se já assinou
        $existente = EspelhoAssinatura::where('user_id', $userId)
            ->where('mes', $mes)
            ->where('ano', $ano)
            ->first();

        if ($existente) {
            return response()->json(['message' => 'O espelho já foi assinado.', 'assinatura' => $existente], 400);
        }

        // Gera hash
        $hashData = $userId . $mes . $ano . now()->toDateTimeString() . Str::random(10);
        $hashAssinatura = hash('sha256', $hashData);

        $assinatura = EspelhoAssinatura::create([
            'user_id' => $userId,
            'empresa_id' => $targetUser->empresa_id,
            'mes' => $mes,
            'ano' => $ano,
            'hash_assinatura' => $hashAssinatura,
            'data_assinatura' => now(),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Assinatura realizada com sucesso!',
            'assinatura' => $assinatura
        ]);
    }
}
