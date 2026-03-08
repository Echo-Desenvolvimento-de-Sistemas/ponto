<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Geofence;
use Illuminate\Http\Request;

class GeofenceController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Geofence::where('empresa_id', $request->user()->empresa_id)->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'raio_metros' => 'nullable|integer|min:1',
        ]);

        $validated['empresa_id'] = $request->user()->empresa_id;

        $geofence = Geofence::create($validated);

        return response()->json($geofence, 201);
    }

    public function show(Request $request, Geofence $geofence)
    {
        if ($geofence->empresa_id !== $request->user()->empresa_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($geofence);
    }

    public function update(Request $request, Geofence $geofence)
    {
        if ($geofence->empresa_id !== $request->user()->empresa_id || $request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nome' => 'sometimes|string|max:255',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'raio_metros' => 'nullable|integer|min:1',
        ]);

        $geofence->update($validated);

        return response()->json($geofence);
    }

    public function destroy(Request $request, Geofence $geofence)
    {
        if ($geofence->empresa_id !== $request->user()->empresa_id || $request->user()->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $geofence->delete();

        return response()->json(null, 204);
    }
}
