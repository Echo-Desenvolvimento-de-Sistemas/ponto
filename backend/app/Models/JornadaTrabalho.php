<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JornadaTrabalho extends Model
{
    protected $fillable = [
        'empresa_id',
        'descricao',
        'horario_entrada',
        'horario_saida',
        'intervalo_inicio',
        'intervalo_fim',
        'escala_tipo',
        'is_noturna',
        'tolerancia_minutos',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function funcionarios()
    {
        return $this->hasMany(FuncionarioDetalhe::class, 'jornada_id');
    }
}
