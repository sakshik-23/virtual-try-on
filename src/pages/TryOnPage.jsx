import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualTryOn } from '../components/VirtualTryOn';

export function TryOnPage({
  activeProduct,
  activeColor,
  activeLens,
  onSelectProduct,
  onSelectColor,
  onSelectLens,
  onPhotoCaptured,
  userSelfie,
  onOpen360,
  onOpenStyleQuiz
}) {
  const navigate = useNavigate();

  return (
    <div className="py-6 px-4">
      <VirtualTryOn
        activeProduct={activeProduct}
        activeColor={activeColor}
        activeLens={activeLens}
        onSelectProduct={onSelectProduct}
        onSelectColor={onSelectColor}
        onSelectLens={onSelectLens}
        onPhotoCaptured={onPhotoCaptured}
        onGoToDittoGrid={() => navigate('/')}
        initialCapturedPhoto={userSelfie}
        onOpen360={onOpen360}
        onOpenStyleQuiz={onOpenStyleQuiz}
      />
    </div>
  );
}
