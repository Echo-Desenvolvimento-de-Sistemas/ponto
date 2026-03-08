<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Geofence;
use App\Models\RegistroPonto;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\FaceRecognitionService;

class RegistroPontoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = RegistroPonto::with('user:id,name');

        if ($user->role === 'funcionario') {
            $query->where('user_id', $user->id);
        } else {
            $query->where('empresa_id', $user->empresa_id);
        }

        // Filtros opcionais por mês/ano
        if ($request->filled('mes') && $request->filled('ano')) {
            $query->whereMonth('horario_dispositivo', $request->mes)
                ->whereYear('horario_dispositivo', $request->ano);
        } elseif ($request->filled('mes')) {
            $query->whereMonth('horario_dispositivo', $request->mes);
        }

        return response()->json($query->orderBy('horario_dispositivo', 'desc')->get());
    }
    public function resumo(Request $request)
    {
        $user = $request->user();
        $hoje = \Carbon\Carbon::today();

        $pontosHoje = RegistroPonto::where('user_id', $user->id)
            ->whereDate('horario_servidor', $hoje)
            ->orderBy('horario_servidor', 'asc')
            ->get();

        $minutosTrabalhados = 0;
        $entradaAtual = null;

        $ultimoPonto = $pontosHoje->last();
        $proximoPasso = 'Bata seu ponto inicial para começar';

        foreach ($pontosHoje as $ponto) {
            if ($ponto->tipo === 'entrada' || $ponto->tipo === 'fim_intervalo') {
                $entradaAtual = \Carbon\Carbon::parse($ponto->horario_servidor);
            } elseif (($ponto->tipo === 'saida' || $ponto->tipo === 'inicio_intervalo') && $entradaAtual) {
                $saida = \Carbon\Carbon::parse($ponto->horario_servidor);
                $minutosTrabalhados += $entradaAtual->diffInMinutes($saida);
                $entradaAtual = null;
            }
        }

        $pontosMes = RegistroPonto::where('user_id', $user->id)
            ->whereMonth('horario_dispositivo', $hoje->month)
            ->whereYear('horario_dispositivo', $hoje->year)
            ->orderBy('horario_dispositivo', 'asc')
            ->get();

        $minutosMes = 0;
        $entradaMes = null;
        foreach ($pontosMes as $p) {
            if ($p->tipo === 'entrada' || $p->tipo === 'fim_intervalo') {
                $entradaMes = \Carbon\Carbon::parse($p->horario_dispositivo);
            } elseif (($p->tipo === 'saida' || $p->tipo === 'inicio_intervalo') && $entradaMes) {
                $minutosMes += $entradaMes->diffInMinutes(\Carbon\Carbon::parse($p->horario_dispositivo));
                $entradaMes = null;
            }
        }

        // Frontend will perform the real-time calculations
        return response()->json([
            'base_minutos_hoje' => $minutosTrabalhados,
            'base_minutos_mes' => $minutosMes,
            'inicio_intervalo_atual' => $entradaAtual ? $entradaAtual->toIso8601String() : null,
            'pontos_hoje' => $pontosHoje
        ]);
    }

    /**
     * Resumo mensal de pontos para o funcionário.
     */
    public function resumoMensal(Request $request)
    {
        $user = $request->user();
        $mes = $request->input('mes', now()->month);
        $ano = $request->input('ano', now()->year);

        $pontos = RegistroPonto::where('user_id', $user->id)
            ->whereMonth('horario_dispositivo', $mes)
            ->whereYear('horario_dispositivo', $ano)
            ->orderBy('horario_dispositivo', 'asc')
            ->get();

        // Calcular dias com pelo menos 1 ponto
        $diasPresentes = $pontos->map(fn($p) => \Carbon\Carbon::parse($p->horario_dispositivo)->toDateString())
            ->unique()->count();

        // Calcular total de horas trabalhadas
        $minutosTotais = 0;
        $entradaAtual = null;
        foreach ($pontos as $p) {
            if (in_array($p->tipo, ['entrada', 'fim_intervalo'])) {
                $entradaAtual = \Carbon\Carbon::parse($p->horario_dispositivo);
            } elseif (in_array($p->tipo, ['saida', 'inicio_intervalo']) && $entradaAtual) {
                $minutosTotais += $entradaAtual->diffInMinutes(\Carbon\Carbon::parse($p->horario_dispositivo));
                $entradaAtual = null;
            }
        }

        $horas = floor($minutosTotais / 60);
        $minutos = $minutosTotais % 60;

        // Dias úteis no mês (Seg–Sex)
        $inicio = \Carbon\Carbon::create($ano, $mes, 1);
        $fim = $inicio->copy()->endOfMonth();
        $diasUteis = 0;
        for ($d = $inicio->copy(); $d->lte($fim); $d->addDay()) {
            if ($d->isWeekday())
                $diasUteis++;
        }

        // Faltas = dias úteis passados sem ponto (excluindo fins de semana)
        $diasComPonto = $pontos->map(fn($p) => \Carbon\Carbon::parse($p->horario_dispositivo)->toDateString())
            ->unique()->values()->toArray();

        $hoje = now()->toDateString();
        $faltas = 0;
        for ($d = $inicio->copy(); $d->toDateString() < $hoje && $d->lte($fim); $d->addDay()) {
            if ($d->isWeekday() && !in_array($d->toDateString(), $diasComPonto)) {
                $faltas++;
            }
        }

        // Atrasos = pontos de entrada com horario_dispositivo após 08:15 (tolerância padrão)
        $atrasos = $pontos->where('tipo', 'entrada')->filter(function ($p) {
            $hora = \Carbon\Carbon::parse($p->horario_dispositivo);
            return $hora->format('H:i') > '08:15';
        })->count();

        $inicioIntervaloAtual = null;
        if ($entradaAtual && $mes == now()->month && $ano == now()->year) {
            $inicioIntervaloAtual = $entradaAtual->toIso8601String();
        }

        return response()->json([
            'base_minutos_totais' => $minutosTotais,
            'inicio_intervalo_atual' => $inicioIntervaloAtual,
            'horas_trabalhadas' => sprintf('%dh %02dm', $horas, $minutos),
            'dias_presentes' => $diasPresentes,
            'dias_uteis' => $diasUteis,
            'faltas' => $faltas,
            'atrasos' => $atrasos,
        ]);
    }

    public function store(Request $request, FaceRecognitionService $faceService)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:entrada,saida,inicio_intervalo,fim_intervalo',
            'horario_dispositivo' => 'nullable|date',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_offline' => 'nullable|boolean',
            'face_descriptor' => 'nullable'
        ]);

        $user = $request->user();

        // Validação: Impedir duplo registro do mesmo tipo no mesmo dia
        $jaRegistrado = RegistroPonto::where('user_id', $user->id)
            ->where('tipo', $validated['tipo'])
            ->whereDate('horario_servidor', now()->toDateString())
            ->exists();

        if ($jaRegistrado) {
            $labelTipo = str_replace('_', ' ', $validated['tipo']);
            // Se for inicio_intervalo -> inicio intervalo. Se for fim_intervalo -> fim intervalo.
            if ($validated['tipo'] === 'inicio_intervalo')
                $labelTipo = 'almoço (saída)';
            if ($validated['tipo'] === 'fim_intervalo')
                $labelTipo = 'almoço (retorno)';

            return response()->json([
                'error' => "Você já registrou {$labelTipo} hoje."
            ], 422);
        }

        // Validação Facial
        if ($user->detalhes && $user->detalhes->face_descriptor) {
            if (!$request->has('face_descriptor')) {
                return response()->json([
                    'error' => 'O reconhecimento facial é obrigatório para este usuário.',
                    'requires_face' => true
                ], 403);
            }

            $similarity = $faceService->compare($user->detalhes->face_descriptor, $request->face_descriptor);

            if (!$faceService->isMatch($similarity)) {
                return response()->json([
                    'error' => "Reconhecimento facial falhou (Similaridade: " . round($similarity, 2) . "%). Tente novamente em um ambiente mais iluminado.",
                    'similarity' => $similarity
                ], 403);
            }
        }

        $isValid = false;
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $isValid = $this->validateLocation($user->empresa_id, $validated['latitude'], $validated['longitude']);
        }

        if (!$isValid && !$request->has('justificativa')) {
            return response()->json([
                'error' => 'Registro fora do raio permitido. Uma justificativa é obrigatória.',
                'requires_justification' => true
            ], 403);
        }

        $ponto = RegistroPonto::create([
            'user_id' => $user->id,
            'empresa_id' => $user->empresa_id,
            'tipo' => $validated['tipo'],
            'horario_servidor' => now(),
            'horario_dispositivo' => $validated['horario_dispositivo'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'is_offline' => $validated['is_offline'] ?? false,
            'is_out_of_bounds' => !$isValid,
            'status' => $isValid ? 'valido' : 'alerta_geofence',
            'justificativa' => !$isValid ? $request->input('justificativa') : null,
            'status_justificativa' => !$isValid ? 'pendente' : null,
            // Hash AFD simplificado para exemplo: sha256(user_id + tipo + horario_servidor)
            'hash_afd' => hash('sha256', $user->id . $validated['tipo'] . now()->toDateTimeString()),
            'hash_comprovante' => hash('sha256', (string) Str::uuid() . $user->id . uniqid())
        ]);

        return response()->json([
            'message' => 'Ponto registrado!',
            'data' => $ponto
        ], 201);
    }

    public function comprovante(Request $request, $id)
    {
        $user = $request->user();

        $ponto = RegistroPonto::where('id', $id)
            ->where(function ($query) use ($user) {
                if ($user->role === 'funcionario') {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('empresa_id', $user->empresa_id);
                }
            })
            ->with(['user.detalhes', 'empresa'])
            ->firstOrFail();

        return response()->json([
            'ponto' => $ponto,
            'funcionario' => [
                'nome' => $ponto->user->name,
                'cpf' => $ponto->user->detalhes->cpf ?? 'Não Informado',
                'pis' => $ponto->user->detalhes->pis ?? 'Não Informado',
            ],
            'empresa' => [
                'razao_social' => $ponto->empresa->razao_social,
                'cnpj' => $ponto->empresa->cnpj,
                'logo' => $ponto->empresa->logo,
            ]
        ]);
    }

    public function justificativasPendentes(Request $request)
    {
        $user = $request->user();

        $query = RegistroPonto::with('user:id,name')
            ->whereNotNull('justificativa')
            ->where('status_justificativa', 'pendente');

        if ($user->role === 'funcionario') {
            $query->where('user_id', $user->id);
        } else {
            $query->where('empresa_id', $user->empresa_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function avaliarJustificativa(Request $request, $id)
    {
        $request->validate([
            'status_justificativa' => 'required|in:aprovada,rejeitada',
            'nota_empresa' => 'nullable|string'
        ]);

        $user = $request->user();
        if ($user->role === 'funcionario') {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $ponto = RegistroPonto::findOrFail($id);

        if ($user->role !== 'admin_global' && $ponto->empresa_id !== $user->empresa_id) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $ponto->update([
            'status_justificativa' => $request->status_justificativa,
            'nota_empresa' => $request->nota_empresa,
            'status' => $request->status_justificativa === 'aprovada' ? 'valido' : 'rejeitado'
        ]);

        return response()->json([
            'message' => 'Justificativa avaliada com sucesso.',
            'data' => $ponto
        ]);
    }

    private function validateLocation($empresaId, $latFuncionario, $lngFuncionario)
    {
        $cercas = Geofence::where('empresa_id', $empresaId)->get();

        if ($cercas->isEmpty()) {
            return true; // Se não tem cerca configurada, considera válido
        }

        foreach ($cercas as $cerca) {
            $distancia = $this->calcularDistancia(
                $latFuncionario,
                $lngFuncionario,
                $cerca->latitude,
                $cerca->longitude
            );

            if ($distancia <= $cerca->raio_metros) {
                return true;
            }
        }

        return false;
    }

    private function calcularDistancia($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // Raio da terra em metros

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * asin(sqrt($a));

        return $earthRadius * $c;
    }
}
