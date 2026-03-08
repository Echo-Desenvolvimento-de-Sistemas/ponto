<?php

namespace App\Services;

class FaceRecognitionService
{
    /**
     * Compara dois descritores faciais e retorna a similaridade.
     * 
     * @param array|string $descriptor1
     * @param array|string $descriptor2
     * @return float Similaridade de 0 a 100
     */
    public function compare($descriptor1, $descriptor2): float
    {
        if (is_string($descriptor1))
            $descriptor1 = json_decode($descriptor1, true);
        if (is_string($descriptor2))
            $descriptor2 = json_decode($descriptor2, true);

        if (!$descriptor1 || !$descriptor2)
            return 0.0;

        $distance = $this->euclideanDistance($descriptor1, $descriptor2);

        // Na face-api.js, uma distância < 0.6 é geralmente considerada a mesma pessoa.
        // Vamos converter isso para um percentual de 0 a 100.
        // 0 de distância = 100% similaridade
        // 0.6 de distância = limiar de aceitação (ex: 90%)
        // 1.0 ou mais de distância = 0% similaridade

        $similarity = max(0, 100 - ($distance * 100));

        return (float) $similarity;
    }

    /**
     * Calcula a distância euclidiana entre dois vetores.
     */
    private function euclideanDistance(array $v1, array $v2): float
    {
        $sum = 0.0;
        foreach ($v1 as $i => $value) {
            $sum += pow($value - $v2[$i], 2);
        }
        return sqrt($sum);
    }

    /**
     * Verifica se a similaridade atinge o limiar seguro.
     */
    public function isMatch(float $similarity, float $threshold = 40.0): bool
    {
        // Nota: O cálculo de similaridade acima é arbitrário. 
        // Se a distância for 0.6, a similaridade será 40%.
        // Um threshold de 40% (distância 0.6) é o padrão da face-api.js.
        return $similarity >= $threshold;
    }
}
