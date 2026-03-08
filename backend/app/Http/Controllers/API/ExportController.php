<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RegistroPonto;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ExportController extends Controller
{
    public function exportAfd(Request $request)
    {
        // Require HR or Global Admin role
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $pontos = RegistroPonto::with('user.detalhes')
            ->where('empresa_id', $request->user()->empresa_id)
            ->whereBetween('horario_servidor', [$validated['start_date'], $validated['end_date']])
            ->orderBy('horario_servidor', 'asc')
            ->get();

        $sd = Carbon::parse($validated['start_date']);
        $ed = Carbon::parse($validated['end_date']);

        $nsr = 1;
        $afdContent = "";

        // Header do arquivo (Tipo 1)
        // Pos: 1-9 (NSR), 10 (Tipo), 11 (Tipo Identificador - 1 para CNPJ), 12-25 (Identificador), 26-37 (CEI), 38-52 (Brancos), 53-152 (Razão Social), 153-160 (Data Início), 161-168 (Data Fim), 169-176 (Data Geração), 177-180 (Hora Geração)
        $cnpj = preg_replace('/\D/', '', $request->user()->empresa->cnpj ?? '00000000000000');
        $razaoSocial = mb_substr($request->user()->empresa->nome ?? 'RAZAO SOCIAL EMPRESA', 0, 100);

        $header = sprintf(
            "%09d" . "1" . "1" . "%014d" . "%-12s" . "%-15s" . "%-100s" . "%s" . "%s" . "%s" . "%s",
            $nsr++,
            $cnpj,
            ' ', // CEI (vazio)
            ' ', // Brancos
            $razaoSocial,
            $sd->format('dmY'),
            $ed->format('dmY'),
            date('dmY'),
            date('Hi')
        );
        $afdContent .= $header . "\r\n";

        foreach ($pontos as $ponto) {
            $data = $ponto->horario_servidor->format('dmY');
            $hora = $ponto->horario_servidor->format('Hi');
            $pis = preg_replace('/\D/', '', $ponto->user->detalhes->pis ?? '000000000000');

            // Registro de Marcação (Tipo 3)
            // Pos: 1-9 (NSR), 10 (Tipo), 11-22 (PIS), 23-30 (Data), 31-34 (Hora)
            $linha = sprintf(
                "%09d" . "3" . "%012s" . "%s" . "%s",
                $nsr++,
                str_pad($pis, 12, '0', STR_PAD_LEFT),
                $data,
                $hora
            );
            $afdContent .= $linha . "\r\n";
        }

        // Trailer (Tipo 9)
        // Pos: 1-9 (NSR), 10 (Tipo)
        $afdContent .= sprintf("%09d", $nsr++) . "9";

        return response($afdContent)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', 'attachment; filename="AFD_' . date('Ymd') . '.txt"');
    }

    public function exportFolha(Request $request)
    {
        // Require HR or Global Admin role
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $mes = $request->query('mes', date('m'));
        $ano = $request->query('ano', date('Y'));
        $empresaId = $request->user()->empresa_id;

        $startDate = Carbon::createFromDate($ano, $mes, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $funcionarios = User::with([
            'detalhes.jornada',
            'registrosPonto' => function ($q) use ($startDate, $endDate) {
                $q->whereBetween('horario_dispositivo', [$startDate, $endDate])->orderBy('horario_dispositivo');
            }
        ])
            ->where('empresa_id', $empresaId)
            ->where('role', 'funcionario')
            ->get();

        $csvHeader = [
            'ID',
            'Nome_Completo',
            'CPF_PIS',
            'Data',
            'Dia_Semana',
            'Entrada',
            'Saida_Almoco',
            'Retorno_Almoco',
            'Saida',
            'Batidas_Extras',
            'Total_Dia',
            'Horas_Extras',
            'Horas_Debito',
            'Adicional_Noturno',
            'Status'
        ];

        $output = fopen('php://temp', 'r+');
        // Add BOM for UTF-8 Excel support
        fputs($output, $bom = (chr(0xEF) . chr(0xBB) . chr(0xBF)));
        fputcsv($output, $csvHeader, ';');

        $diasDoMes = $startDate->daysInMonth;

        $totalExtrasMes = 0;
        $totalDebitosMes = 0;
        $totalNoturnoMes = 0;

        foreach ($funcionarios as $func) {
            $jornada = $func->detalhes->jornada ?? null;
            $jornadaMinutos = 0;
            if ($jornada && $jornada->horario_entrada && $jornada->horario_saida) {
                $jIn = Carbon::parse($jornada->horario_entrada);
                $jOut = Carbon::parse($jornada->horario_saida);
                $jornadaMinutos = $jOut->diffInMinutes($jIn);

                if ($jornada->intervalo_inicio && $jornada->intervalo_fim) {
                    $iIn = Carbon::parse($jornada->intervalo_inicio);
                    $iOut = Carbon::parse($jornada->intervalo_fim);
                    $jornadaMinutos -= $iOut->diffInMinutes($iIn);
                }
            }

            // Agrupar pontos por dia
            $pontos = $func->registrosPonto;
            $diasAgrupados = [];
            foreach ($pontos as $p) {
                $dia = $p->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('Y-m-d');
                $diasAgrupados[$dia][] = $p;
            }

            for ($i = 1; $i <= $diasDoMes; $i++) {
                $diaObj = $startDate->copy()->addDays($i - 1);
                $diaStr = $diaObj->format('Y-m-d');
                $diaSemana = $diaObj->locale('pt_BR')->translatedFormat('l');

                $pts = $diasAgrupados[$diaStr] ?? [];

                $entrada = '';
                $saidaAlmoco = '';
                $retornoAlmoco = '';
                $saida = '';
                $extrasStr = [];

                $totalMinutos = 0;
                $noturnoMinutos = 0;
                $status = 'Normal';

                if (empty($pts)) {
                    if ($diaObj->isWeekend()) {
                        $status = 'Fim de Semana';
                    } elseif ($diaObj->isFuture()) {
                        $status = '-'; // Ainda não aconteceu
                    } else {
                        $status = 'Falta';
                    }
                } else {
                    // Preencher colunas principais baseadas na ordem cronológica
                    $ptsSorted = collect($pts)->sortBy(function ($p) {
                        return $p->horario_dispositivo->timestamp;
                    })->values();

                    // Lógica para detectar as 4 batidas principais e extras
                    $mainEntrada = $ptsSorted->where('tipo', 'entrada')->first();
                    $mainSaidaAlmoco = $ptsSorted->where('tipo', 'inicio_intervalo')->first();
                    $mainRetornoAlmoco = $ptsSorted->where('tipo', 'fim_intervalo')->last(); // Pega a última na dúvida, ou a primeira após inicio
                    $mainSaida = $ptsSorted->where('tipo', 'saida')->last();

                    if ($mainEntrada)
                        $entrada = $mainEntrada->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('H:i');
                    if ($mainSaidaAlmoco)
                        $saidaAlmoco = $mainSaidaAlmoco->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('H:i');
                    if ($mainRetornoAlmoco)
                        $retornoAlmoco = $mainRetornoAlmoco->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('H:i');
                    if ($mainSaida)
                        $saida = $mainSaida->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('H:i');

                    // EXTRAIR o que não é principal
                    $mainIds = array_filter([$mainEntrada->id ?? null, $mainSaidaAlmoco->id ?? null, $mainRetornoAlmoco->id ?? null, $mainSaida->id ?? null]);
                    foreach ($ptsSorted as $p) {
                        if (!in_array($p->id, $mainIds)) {
                            $extrasStr[] = $p->horario_dispositivo->copy()->timezone('America/Sao_Paulo')->format('H:i');
                        }
                    }

                    if ($mainEntrada && !$mainSaida) {
                        $status = 'Esquecimento (Sem Saída)';
                    }

                    // Calcular total horas trabalhadas no dia somando os diffs
                    $entradaAtual = null;
                    foreach ($ptsSorted as $p) {
                        $horaLocal = $p->horario_dispositivo->copy()->timezone('America/Sao_Paulo');

                        if ($p->tipo === 'entrada' || $p->tipo === 'fim_intervalo') {
                            $entradaAtual = $horaLocal;
                        } elseif (($p->tipo === 'saida' || $p->tipo === 'inicio_intervalo') && $entradaAtual) {
                            $saidaAtual = $horaLocal;
                            $diff = $entradaAtual->diffInMinutes($saidaAtual);
                            $totalMinutos += $diff;

                            // Calcular adicional noturno (22:00 às 05:00) para este segmento
                            $currentMin = $entradaAtual->copy();
                            while ($currentMin->lt($saidaAtual)) {
                                $h = $currentMin->hour;
                                if ($h >= 22 || $h < 5) {
                                    $noturnoMinutos++;
                                }
                                $currentMin->addMinute();
                            }

                            $entradaAtual = null;
                        }
                    }
                }

                $extrasMinutos = 0;
                $debitoMinutos = 0;

                if (!empty($pts) && $jornadaMinutos > 0) {
                    if ($totalMinutos > $jornadaMinutos) {
                        $extrasMinutos = $totalMinutos - $jornadaMinutos;
                    } elseif ($totalMinutos < $jornadaMinutos) {
                        $debitoMinutos = $jornadaMinutos - $totalMinutos;
                    }
                } elseif (empty($pts) && !$diaObj->isWeekend() && !$diaObj->isFuture() && $jornadaMinutos > 0) {
                    $debitoMinutos = $jornadaMinutos;
                }

                // Acumula totais do mês
                $totalExtrasMes += $extrasMinutos;
                $totalDebitosMes += $debitoMinutos;
                $totalNoturnoMes += $noturnoMinutos;

                $formatTime = function ($mins) {
                    if ($mins == 0)
                        return '00:00';
                    $h = floor($mins / 60);
                    $m = $mins % 60;
                    return sprintf('%02d:%02d', $h, $m);
                };

                // Identificador do Funcionario (CPF ou Matricula) - Formatado para Excel como Texto
                $cpf = str_pad(preg_replace('/\D/', '', $func->detalhes->cpf ?? ''), 11, '0', STR_PAD_LEFT);
                $pis = str_pad(preg_replace('/\D/', '', $func->detalhes->pis ?? ''), 11, '0', STR_PAD_LEFT);
                $cpfPisFormatted = '="' . $cpf . ' / ' . $pis . '"';

                fputcsv($output, [
                    $func->detalhes->matricula ?? $func->id,
                    $func->name,
                    $cpfPisFormatted,
                    $diaObj->format('d/m/Y'),
                    ucwords($diaSemana),
                    $entrada,
                    $saidaAlmoco,
                    $retornoAlmoco,
                    $saida,
                    implode(', ', $extrasStr),
                    $formatTime($totalMinutos),
                    $formatTime($extrasMinutos),
                    $formatTime($debitoMinutos),
                    $formatTime($noturnoMinutos),
                    $status
                ], ';');
            }
        }

        // Linha de Totais do Mês
        $formatTimeFinal = function ($mins) {
            $h = floor($mins / 60);
            $m = $mins % 60;
            return sprintf('%02d:%02d', $h, $m);
        };

        fputcsv($output, [
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            'TOTAL DO MÊS:',
            '',
            $formatTimeFinal($totalExtrasMes),
            $formatTimeFinal($totalDebitosMes),
            $formatTimeFinal($totalNoturnoMes),
            ''
        ], ';');

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return response($csvContent)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="Folha_' . $mes . '_' . $ano . '.csv"');
    }
}
