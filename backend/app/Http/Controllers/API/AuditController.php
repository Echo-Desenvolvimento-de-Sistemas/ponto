<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Apenas admin global ou admin da empresa podem ver os logs
        if ($user->role === 'funcionario') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::with('user:id,name,role')->orderBy('created_at', 'desc');

        if ($user->role !== 'admin_global') {
            $query->where('empresa_id', $user->empresa_id);
        }

        $logs = $query->paginate(50);

        return response()->json($logs);
    }
}
