<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FuncionarioDetalhe extends Model
{
    protected $fillable = [
        'user_id',
        'jornada_id',
        'pis',
        'cpf',
        'matricula',
        'cargo',
        'data_admissao',
        'regime_contratacao',
        'intervalo_inicio',
        'intervalo_fim',
        'setup_token',
        'face_descriptor',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function jornada()
    {
        return $this->belongsTo(JornadaTrabalho::class, 'jornada_id');
    }
}
