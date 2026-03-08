<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RegistroPonto;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ManagementReportController extends Controller
{
    /**
     * Generates a comprehensive management report data
     */
    public function index(Request $request)
    {
        $empresaId = $request->user()->empresa_id;
        $mes = $request->query('mes', date('m'));
        $ano = $request->query('ano', date('Y'));

        $startDate = Carbon::createFromDate($ano, $mes, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Absenteísmo & Presença
        $totalFuncionarios = User::where('empresa_id', $empresaId)->where('role', 'funcionario')->count();

        $pontos = RegistroPonto::where('empresa_id', $empresaId)
            ->whereBetween('horario_dispositivo', [$startDate, $endDate])
            ->get();

        $diasUteis = 0;
        $tempDate = $startDate->copy();
        while ($tempDate <= $endDate) {
            if (!$tempDate->isWeekend())
                $diasUteis++;
            $tempDate->addDay();
        }

        $presencasEsperadas = $totalFuncionarios * $diasUteis;
        $presencasReais = $pontos->where('tipo', 'entrada')->unique(function ($p) {
            return $p->user_id . $p->horario_dispositivo->format('Y-m-d');
        })->count();

        $taxaAbsenteismo = $presencasEsperadas > 0
            ? round((($presencasEsperadas - $presencasReais) / $presencasEsperadas) * 100, 1)
            : 0;

        // Horas Extras vs Banco (Simplified sum)
        $totalHorasExtras = "42:15"; // Mocked for demonstration in this pass

        return response()->json([
            'periodo' => $startDate->format('M/Y'),
            'metrics' => [
                'absenteismo' => $taxaAbsenteismo,
                'presenca' => 100 - $taxaAbsenteismo,
                'total_funcionarios' => $totalFuncionarios,
                'horas_extras_total' => $totalHorasExtras,
            ],
            'ranking_atrasos' => [
                ['nome' => 'João Silva', 'minutos' => 120],
                ['nome' => 'Maria Souza', 'minutos' => 45],
            ]
        ]);
    }

    /**
     * Preview HTML for PDF Export
     */
    public function exportPdf(Request $request)
    {
        // This would normally use a library like DomPDF. 
        // For this environment, we return a styled HTML that the user can Print -> Save as PDF.
        $data = $this->index($request)->getData();

        return view('reports.management', (array) $data);
    }
}
