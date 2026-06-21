<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

class RandeeSliderComponent extends CBitrixComponent
{
    public function executeComponent()
    {
        $this->arResult = [
            'TITLE' => $this->arParams['TITLE'] ?? 'Randee Slider',
            'SUBTITLE' => $this->arParams['SUBTITLE'] ?? 'Preview your component in Studio',
        ];

        $this->IncludeComponentTemplate();
    }
}

