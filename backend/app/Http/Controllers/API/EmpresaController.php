<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class EmpresaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Only global admin can view all empresas. Otherwise, view only own empresa.
        if ($request->user()->role === 'admin_global') {
            return response()->json(Empresa::all());
        }

        return response()->json(Empresa::where('id', $request->user()->empresa_id)->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin_global') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nome_fantasia' => 'required|string|max:255',
            'razao_social' => 'required|string|max:255',
            'cnpj' => 'required|string|unique:empresas',
            'configuracoes' => 'nullable|array',
        ]);

        $empresa = Empresa::create($validated);

        return response()->json($empresa, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Empresa $empresa)
    {
        if ($request->user()->role !== 'admin_global' && $request->user()->empresa_id !== $empresa->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($empresa);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Empresa $empresa)
    {
        if ($request->user()->role !== 'admin_global' && $request->user()->empresa_id !== $empresa->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nome_fantasia' => 'sometimes|string|max:255',
            'razao_social' => 'sometimes|string|max:255',
            'cnpj' => 'sometimes|string|unique:empresas,cnpj,' . $empresa->id,
            'configuracoes' => 'nullable|array',
        ]);

        $empresa->update($validated);

        return response()->json($empresa);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Empresa $empresa)
    {
        if ($request->user()->role !== 'admin_global') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $empresa->delete();

        return response()->json(null, 204);
    }
}
