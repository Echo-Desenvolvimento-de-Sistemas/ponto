<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Geofence extends Model
{
    protected $fillable = [
        'empresa_id',
        'nome',
        'latitude',
        'longitude',
        'raio_metros',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}
