<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\WhiteLabelConfig;

class WhiteLabelController extends Controller
{
    /**
     * Obter as configurações de whitelabel.
     *
     * Hierarquia de prioridade:
     *   1. Config da empresa do usuário logado (empresa_rh / funcionario)
     *   2. Config global (definida pelo admin_global)
     *   3. Padrões do sistema (PontoNow defaults)
     */
    public function index(Request $request)
    {
        $defaults = [
            'systemName' => 'PontoNow',
            'primaryColor' => '#d19bf7',
            'logoUrl' => null,
            'loginBgUrl' => null,
        ];

        $user = $request->user('sanctum');

        // Carrega o tema global (base)
        $globalConfig = WhiteLabelConfig::where('empresa_id', 'global')->first();

        // Se o usuário não está autenticado (tela de login), devolve o tema global ou os defaults
        if (!$user) {
            $data = $globalConfig ? $globalConfig->toArray() : $defaults;
            return response()->json($this->normalizeConfig($data));
        }

        // admin_global sempre vê e edita o tema global
        if ($user->role === 'admin_global') {
            $data = $globalConfig ? $globalConfig->toArray() : $defaults;
            return response()->json($this->normalizeConfig($data));
        }

        // Para empresa_rh e funcionários: tenta o tema da empresa primeiro
        $empresaConfig = WhiteLabelConfig::where('empresa_id', $user->empresa_id)->first();

        if ($empresaConfig) {
            // Mescla: pega os valores da empresa onde existirem, e do global para o que faltar
            $merged = array_merge(
                $defaults,
                $globalConfig ? $globalConfig->toArray() : [],
                $empresaConfig->toArray()
            );
            return response()->json($this->normalizeConfig($merged));
        }

        // Sem config da empresa → usa o tema global
        $data = $globalConfig ? $globalConfig->toArray() : $defaults;
        return response()->json($this->normalizeConfig($data));
    }

    /**
     * Garante que logoUrl e loginBgUrl sejam sempre URLs absolutas.
     * Resolve registros antigos que tinham paths relativos (/storage/...).
     */
    private function normalizeConfig(array $data): array
    {
        $appUrl = rtrim(config('app.url'), '/');

        foreach (['logoUrl', 'loginBgUrl'] as $field) {
            if (!empty($data[$field])) {
                $url = $data[$field];
                // Se já for absoluta, mantém; se relativa, prefixar com APP_URL
                if (!str_starts_with($url, 'http')) {
                    $url = $appUrl . '/' . ltrim($url, '/');
                }
                // Remove barras duplas no path (preserva o https://)
                $data[$field] = preg_replace('#(?<!:)//+#', '/', $url);
            }
        }

        return $data;
    }



    /**
     * Atualiza as configurações de whitelabel, incluindo uploads.
     */
    public function store(Request $request)
    {
        // Apenas admin_global e empresa_rh podem salvar
        $allowedRoles = ['admin_global', 'empresa_rh'];
        if (!in_array($request->user()->role, $allowedRoles)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'systemName' => 'sometimes|nullable|string|max:255',
            'primaryColor' => 'sometimes|nullable|string|max:50',
            'logo' => 'sometimes|nullable|file|image|mimes:jpeg,png,jpg,webp|max:2048',
            'loginBg' => 'sometimes|nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Monta apenas os campos que vieram no request (evita sobrescrever com null)
        // NOTA: array_filter sem callback remove strings vazias — usamos is_null estritamente
        $raw = $request->only(['systemName', 'primaryColor']);
        $data = [];
        foreach ($raw as $key => $value) {
            if (!is_null($value) && $value !== '') {
                $data[$key] = $value;
            }
        }

        // admin_global salva como 'global'; empresa usa seu próprio empresa_id
        $tenantId = $request->user()->role === 'admin_global'
            ? 'global'
            : (string) $request->user()->empresa_id;

        // Processar upload da logo
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('whitelabel/' . $tenantId . '/logos', 'public');
            $data['logoUrl'] = Storage::url($logoPath);
        }

        // Processar upload do background
        if ($request->hasFile('loginBg')) {
            $bgPath = $request->file('loginBg')->store('whitelabel/' . $tenantId . '/backgrounds', 'public');
            $data['loginBgUrl'] = Storage::url($bgPath);
        }

        // Debug: loga o que chegou e o que será salvo
        \Log::info('WhiteLabel store', [
            'user_id' => $request->user()->id,
            'role' => $request->user()->role,
            'tenantId' => $tenantId,
            'raw_input' => $request->all(),
            'data' => $data,
        ]);

        // Garante que há algo para salvar
        if (empty($data)) {
            return response()->json(['message' => 'Nenhum dado para salvar. Envie ao menos primaryColor ou systemName.'], 422);
        }

        $config = WhiteLabelConfig::updateOrCreate(
            ['empresa_id' => $tenantId],
            $data
        );

        return response()->json([
            'message' => 'Configurações de Identidade Visual atualizadas com sucesso.',
            'data' => $config
        ]);
    }
}
