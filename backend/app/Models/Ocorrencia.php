<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ocorrencia extends Model
{
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'user_id',
        'tipo',
        'data_ocorrencia',
        'horario_sugerido',
        'justificativa',
        'anexo_url',
        'status',
        'avaliador_id',
        'observacao_gestor'
    ];

    /**
     * O funcionário que abriu a solicitação/ocorrência.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * O gestor que avaliou a solicitação/ocorrência.
     */
    public function avaliador()
    {
        return $this->belongsTo(User::class, 'avaliador_id');
    }

    /**
     * Empresa da ocorrência.
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}
