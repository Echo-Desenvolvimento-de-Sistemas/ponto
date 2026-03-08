<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RegistroPonto extends Model
{
    protected $fillable = [
        'empresa_id',
        'user_id',
        'tipo',
        'horario_servidor',
        'horario_dispositivo',
        'latitude',
        'longitude',
        'is_offline',
        'is_out_of_bounds',
        'status',
        'hash_afd',
        'justificativa',
        'status_justificativa',
        'nota_empresa',
    ];

    protected $casts = [
        'horario_servidor' => 'datetime',
        'horario_dispositivo' => 'datetime',
        'is_offline' => 'boolean',
        'is_out_of_bounds' => 'boolean',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
