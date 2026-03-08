<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FuncionarioDetalhe;

class FacialEnrollmentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'face_descriptor' => 'required'
        ]);

        $user = $request->user();
        $detalhes = $user->detalhes;

        if (!$detalhes) {
            $detalhes = FuncionarioDetalhe::create([
                'user_id' => $user->id,
            ]);
        }

        $descriptor = is_array($request->face_descriptor)
            ? json_encode($request->face_descriptor)
            : $request->face_descriptor;

        $detalhes->update([
            'face_descriptor' => $descriptor
        ]);

        return response()->json([
            'message' => 'Face mestra cadastrada com sucesso!',
            'success' => true
        ]);
    }

    public function status(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'has_face' => (bool) $user->detalhes?->face_descriptor
        ]);
    }
}
