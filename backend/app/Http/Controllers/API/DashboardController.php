<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\RegistroPonto;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->empresa_id;
        $hoje = Carbon::today();

        // For admin_global, we show system-wide SaaS metrics
        if ($user->role === 'admin_global') {
            $totalEmpresas = \App\Models\Empresa::count();
            $totalUsuarios = User::count();
            $ticketsPendentes = \App\Models\PasswordResetTicket::where('status', 'pendente')->count();
            $totalPontosHoje = RegistroPonto::whereDate('horario_dispositivo', $hoje)->count();

            // Recent System Activity (New Companies, New Users, New Tickets)
            $recentCompanies = \App\Models\Empresa::orderBy('created_at', 'desc')->take(4)->get()->map(function ($e) {
                return [
                    'id' => 'emp_' . $e->id,
                    'name' => $e->nome_fantasia ?: $e->razao_social,
                    'role' => 'Nova Empresa',
                    'time' => $e->created_at->diffForHumans(),
                    'type' => 'Registro',
                    'status' => 'success',
                ];
            });

            $recentTickets = \App\Models\PasswordResetTicket::where('status', 'pendente')->orderBy('created_at', 'desc')->take(4)->get()->map(function ($t) {
                return [
                    'id' => 'tic_' . $t->id,
                    'name' => $t->nome_empresa ?: $t->email,
                    'role' => 'Suporte',
                    'time' => $t->created_at->diffForHumans(),
                    'type' => 'Ticket de Senha',
                    'status' => 'warning',
                    'note' => $t->mensagem
                ];
            });

            return response()->json([
                'metrics' => [
                    'total_empresas' => $totalEmpresas,
                    'total_usuarios' => $totalUsuarios,
                    'tickets_pendentes' => $ticketsPendentes,
                    'total_pontos_hoje' => $totalPontosHoje
                ],
                'recent_activity' => $recentCompanies->concat($recentTickets)->sortByDesc('time')->values()
            ]);
        }

        // Base Queries for specific company (RH role)
        $usersQuery = User::where('role', 'funcionario')->where('empresa_id', $empresaId);
        $pontosQuery = RegistroPonto::with('user')->whereDate('horario_dispositivo', $hoje)->where('empresa_id', $empresaId);

        // Metrics Calculus
        $totalColaboradores = $usersQuery->count();

        // Count unique users who have an "entrada" today
        $presentesHoje = $pontosQuery->where('tipo', 'entrada')
            ->distinct('user_id')
            ->count('user_id');

        // Faltas (Simplified logic: Total employees - those present today)
        $faltas = $totalColaboradores - $presentesHoje;

        // Geofence alerts today
        $alertasCerca = RegistroPonto::whereDate('horario_dispositivo', $hoje)
            ->where('empresa_id', $empresaId)
            ->where('is_out_of_bounds', true)->count();

        // Recent Activity Feed
        $recentActivity = RegistroPonto::with('user')
            ->whereDate('horario_dispositivo', $hoje)
            ->where('empresa_id', $empresaId)
            ->orderBy('horario_dispositivo', 'desc')
            ->take(8)
            ->get()
            ->map(function ($ponto) {
                return [
                    'id' => $ponto->id,
                    'name' => $ponto->user ? $ponto->user->name : 'Usuário Deletado',
                    'role' => 'Colaborador',
                    'time' => $ponto->horario_dispositivo->format('H:i'),
                    'type' => self::formatTipoPonto($ponto->tipo),
                    'status' => $ponto->is_out_of_bounds ? 'warning' : 'success',
                    'note' => $ponto->is_out_of_bounds ? 'Fora da cerca' : null,
                    'lat' => $ponto->latitude,
                    'lng' => $ponto->longitude,
                ];
            });

        return response()->json([
            'metrics' => [
                'total_colaboradores' => $totalColaboradores,
                'presentes_hoje' => $presentesHoje,
                'faltas' => max(0, $faltas),
                'alertas_cerca' => $alertasCerca
            ],
            'recent_activity' => $recentActivity
        ]);
    }

    private static function formatTipoPonto($tipo)
    {
        $map = [
            'entrada' => 'Entrada',
            'saida' => 'Saída',
            'inicio_intervalo' => 'Almoço',
            'fim_intervalo' => 'Retorno (Almoço)'
        ];

        return $map[$tipo] ?? ucfirst(str_replace('_', ' ', $tipo));
    }
}
