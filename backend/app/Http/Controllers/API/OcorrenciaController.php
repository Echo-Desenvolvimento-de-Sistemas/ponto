<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Ocorrencia;
use App\Models\RegistroPonto;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class OcorrenciaController extends Controller
{
    /**
     * Listar ocorrências da empresa do usuário (se for admin) ou apenas as próprias (se funcionário).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Ocorrencia::with(['user:id,name', 'avaliador:id,name']);

        if ($user->role === 'funcionario') {
            $query->where('user_id', $user->id);
        } else if ($user->role !== 'admin_global') {
            $query->where('empresa_id', $user->empresa_id);
        }

        // Filtros opcionais
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $ocorrencias = $query->orderBy('created_at', 'desc')->get();

        return response()->json($ocorrencias);
    }

    /**
     * Criar uma nova ocorrência (ex: funcionário pedindo ajuste ou enviando atestado).
     */
    public function store(Request $request)
    {
        $request->validate([
            'tipo' => 'required|string|in:esquecimento_entrada,esquecimento_saida,falta_justificada,atestado,outro',
            'data_ocorrencia' => 'required|date',
            'horario_sugerido' => 'nullable|date_format:H:i',
            'justificativa' => 'nullable|string',
            'anexo' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120', // Max 5MB
        ]);

        $user = $request->user();
        $anexoUrl = null;

        if ($request->hasFile('anexo')) {
            $file = $request->file('anexo');
            $path = $file->storePublicly('atestados', 'public');
            $anexoUrl = Storage::url($path);
        }

        $ocorrencia = Ocorrencia::create([
            'empresa_id' => $user->empresa_id,
            'user_id' => $user->id,
            'tipo' => $request->tipo,
            'data_ocorrencia' => $request->data_ocorrencia,
            'horario_sugerido' => $request->horario_sugerido,
            'justificativa' => $request->justificativa,
            'anexo_url' => $anexoUrl,
            'status' => 'pendente'
        ]);

        return response()->json([
            'message' => 'Solicitação enviada com sucesso.',
            'ocorrencia' => $ocorrencia
        ], 201);
    }

    /**
     * Gestor avalia (Aprova ou Rejeita) a ocorrência.
     */
    public function avaliar(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:aprovada,rejeitada',
            'observacao_gestor' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($user->role === 'funcionario') {
            return response()->json(['message' => 'Sem permissão.'], 403);
        }

        $ocorrencia = Ocorrencia::findOrFail($id);

        if ($user->role !== 'admin_global' && $ocorrencia->empresa_id !== $user->empresa_id) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $ocorrencia->status = $request->status;
        $ocorrencia->avaliador_id = $user->id;
        $ocorrencia->observacao_gestor = $request->observacao_gestor;
        $ocorrencia->save();

        // Se foi aprovada e for esquecimento, já criar/atualizar o registro de ponto
        if ($request->status === 'aprovada' && $ocorrencia->horario_sugerido) {
            $tipoPonto = str_contains($ocorrencia->tipo, 'entrada') ? 'entrada' : 'saida';

            // Criando um ponto artificial aprovado
            RegistroPonto::create([
                'empresa_id' => $ocorrencia->empresa_id,
                'user_id' => $ocorrencia->user_id,
                'tipo' => $tipoPonto,
                'horario_dispositivo' => Carbon::parse($ocorrencia->data_ocorrencia . ' ' . $ocorrencia->horario_sugerido),
                'metodo_autenticacao' => 'ajuste_manual_aprovado',
                'observacao' => 'Ponto inserido via aprovação de ajuste #' . $ocorrencia->id
            ]);
        }

        AuditLog::create([
            'empresa_id' => $ocorrencia->empresa_id,
            'user_id' => $user->id,
            'acao' => 'avaliar_ocorrencia',
            'model_type' => 'App\Models\Ocorrencia',
            'model_id' => $ocorrencia->id,
            'dados_antigos' => ['status' => 'pendente'],
            'dados_novos' => ['status' => $request->status, 'observacao_gestor' => $request->observacao_gestor],
            'ip_address' => $request->ip()
        ]);

        return response()->json([
            'message' => 'Avaliação salva com sucesso.',
            'ocorrencia' => $ocorrencia->load(['user:id,name', 'avaliador:id,name'])
        ]);
    }
}
