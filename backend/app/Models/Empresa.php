<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $fillable = [
        'nome_fantasia',
        'razao_social',
        'cnpj',
        'configuracoes',
    ];

    protected $casts = [
        'configuracoes' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function jornadas()
    {
        return $this->hasMany(JornadaTrabalho::class);
    }

    public function geofences()
    {
        return $this->hasMany(Geofence::class);
    }

    public function registrosPonto()
    {
        return $this->hasMany(RegistroPonto::class);
    }
}
