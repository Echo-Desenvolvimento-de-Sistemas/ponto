<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RegistroPonto;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RelatorioBIController extends Controller
{
    public function index(Request $request)
    {
        $empresaId = $request->user()->empresa_id;
        $mes = clone ($request->input('mes') ? Carbon::create($request->ano ?? now()->year, $request->mes, 1) : now()->startOfMonth());

        $inicio = $mes->copy()->startOfMonth();
        $fim = $mes->copy()->endOfMonth();
        $hoje = now()->endOfDay();

        if ($fim->gt($hoje)) {
            $fimCalculo = $hoje;
        } else {
            $fimCalculo = $fim;
        }

        // 1. Absenteísmo (Faltas estimadas)
        // Precisamos saber dias úteis até o momento vs dias com ponto de cada funcionário ativo
        $funcionarios = User::where('empresa_id', $empresaId)->where('role', 'funcionario')->get();
        $totalFuncionarios = $funcionarios->count();

        $diasUteisAteHoje = 0;
        for ($d = $inicio->copy(); $d->lte($fimCalculo); $d->addDay()) {
            if ($d->isWeekday())
                $diasUteisAteHoje++;
        }

        $pontosMes = RegistroPonto::where('empresa_id', $empresaId)
            ->whereBetween('horario_dispositivo', [$inicio, $fimCalculo])
            ->get();

        $pontosPorUser = $pontosMes->groupBy('user_id');

        $faltasTotal = 0;
        $atrasosPorUser = [];
        $horasExtrasTotal = 0; // em minutos
        $custoProjetadoHoraExtra = 0; // estimativa financeira (custo medio R$ 20/h)

        foreach ($funcionarios as $func) {
            $pontosFunc = $pontosPorUser->get($func->id) ?? collect();

            // Faltas (Dias úteis sem nenhuma batida)
            $diasComBatida = $pontosFunc->map(fn($p) => Carbon::parse($p->horario_dispositivo)->toDateString())->unique()->count();
            $faltas = max(0, $diasUteisAteHoje - $diasComBatida);
            $faltasTotal += $faltas;

            // Atrasos (Entradas após 08:15)
            $entradas = $pontosFunc->where('tipo', 'entrada');
            $atrasos = 0;
            foreach ($entradas as $e) {
                if (Carbon::parse($e->horario_dispositivo)->format('H:i') > '08:15') {
                    $atrasos++;
                }
            }
            if ($atrasos > 0) {
                $atrasosPorUser[] = [
                    'nome' => $func->name,
                    'atrasos' => $atrasos,
                    'cargo' => $func->detalhes->cargo ?? 'N/A'
                ];
            }

            // Horas Extras Diárias (Simplificado: tempo trabalhado > 8h = extra)
            $pontosPorDia = $pontosFunc->groupBy(fn($p) => Carbon::parse($p->horario_dispositivo)->toDateString());
            foreach ($pontosPorDia as $dia => $bates) {
                $minutosDia = 0;
                $ultimoIn = null;
                $batesOrdenados = $bates->sortBy('horario_dispositivo');
                foreach ($batesOrdenados as $b) {
                    if (in_array($b->tipo, ['entrada', 'fim_intervalo'])) {
                        $ultimoIn = Carbon::parse($b->horario_dispositivo);
                    } elseif (in_array($b->tipo, ['saida', 'inicio_intervalo']) && $ultimoIn) {
                        $minutosDia += $ultimoIn->diffInMinutes(Carbon::parse($b->horario_dispositivo));
                        $ultimoIn = null;
                    }
                }

                // Exemplo: se passou de 8h (480 minutos), o excedente é hora extra
                // Ignorando complexidades de DSR e turnos noturnos para este mockup de BI produtivo
                if ($minutosDia > 480) {
                    $horasExtrasTotal += ($minutosDia - 480);
                }
            }
        }

        // Ordenar top atrasados
        usort($atrasosPorUser, fn($a, $b) => $b['atrasos'] <=> $a['atrasos']);
        $topAtrasos = array_slice($atrasosPorUser, 0, 5);

        // Taxa de Absenteísmo: (Faltas Totais) / (Dias Úteis * Funcionários) * 100
        $potencialDias = $diasUteisAteHoje * $totalFuncionarios;
        $taxaAbsenteismo = $potencialDias > 0 ? round(($faltasTotal / $potencialDias) * 100, 2) : 0;

        // Horas extras em Horas e % Custo Estimado
        $heHoras = round($horasExtrasTotal / 60, 1);
        $custoHE = $heHoras * 20 * 1.5; // (Ex: 20/h norm + 50% de hora extra) -> R$ 30 por hr extra na media

        return response()->json([
            'resumo' => [
                'taxa_absenteismo' => $taxaAbsenteismo, // %
                'faltas_mes' => $faltasTotal,
                'horas_extras' => $heHoras, // hrs
                'custo_extra_estimado' => $custoHE // R$
            ],
            'top_atrasos' => $topAtrasos,
            // Mock de graficos evolutivos para o Chart
            'grafico_tendencia' => [
                ['semana' => 'Sem 1', 'absenteismo' => max(0, $taxaAbsenteismo - rand(0, 3)), 'he' => max(0, $heHoras / 4 - rand(0, 2))],
                ['semana' => 'Sem 2', 'absenteismo' => max(0, $taxaAbsenteismo - rand(-2, 2)), 'he' => max(0, $heHoras / 4 - rand(-1, 2))],
                ['semana' => 'Sem 3', 'absenteismo' => max(0, $taxaAbsenteismo - rand(-1, 2)), 'he' => max(0, $heHoras / 4 + rand(0, 3))],
                ['semana' => 'Sem 4', 'absenteismo' => $taxaAbsenteismo, 'he' => max(0, $heHoras / 4 + rand(1, 4))]
            ]
        ]);
    }
}
