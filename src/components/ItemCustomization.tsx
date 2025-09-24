"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Minus, ArrowLeft, ArrowRight } from "lucide-react";
import { EnhancedMenuItem, CustomizationStep, ChoiceOption, ItemCustomization as ItemCustomizationType } from "@/lib/enhancedMenuTypes";

interface ItemCustomizationProps {
  item: EnhancedMenuItem;
  onCustomize: (customizations: ItemCustomizationType[], totalPrice: number) => void;
  onClose: () => void;
  initialCustomizations?: ItemCustomizationType[];
}

export default function ItemCustomization({
  item,
  onCustomize,
  onClose,
  initialCustomizations = []
}: ItemCustomizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [customizations, setCustomizations] = useState<ItemCustomizationType[]>(initialCustomizations);
  const [quantity, setQuantity] = useState(1);

  const steps = item.customization_steps || [];
  const totalSteps = steps.length;

  useEffect(() => {
    // Initialize customizations if not provided
    if (customizations.length === 0 && steps.length > 0) {
      const initialCustomizations = steps.map(step => ({
        choice_id: step.id,
        choice_name: step.name,
        selected_options: [],
        total_modifier: 0,
        is_required: step.type === 'required'
      }));
      setCustomizations(initialCustomizations);
    }
  }, [steps, customizations.length]);

  const handleOptionSelect = (stepId: string, option: ChoiceOption, isSelected: boolean) => {
    setCustomizations(prev => {
      const updated = prev.map(customization => {
        if (customization.choice_id === stepId) {
          let selectedOptions = [...customization.selected_options];
          
          if (isSelected) {
            // Add option if not already selected
            if (!selectedOptions.find(opt => opt.option_id === option.id)) {
              selectedOptions.push({
                option_id: option.id,
                option_name: option.name,
                price_modifier: option.price_modifier,
                image_url: option.image_url
              });
            }
          } else {
            // Remove option
            selectedOptions = selectedOptions.filter(opt => opt.option_id !== option.id);
          }

          const totalModifier = selectedOptions.reduce((sum, opt) => sum + opt.price_modifier, 0);
          
          return {
            ...customization,
            selected_options: selectedOptions,
            total_modifier: totalModifier
          };
        }
        return customization;
      });
      return updated;
    });
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return true;

    const currentCustomization = customizations.find(c => c.choice_id === currentStepData.id);
    if (!currentCustomization) return true;

    const selectedCount = currentCustomization.selected_options.length;
    return selectedCount >= currentStepData.min_selections && selectedCount <= currentStepData.max_selections;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalize customization
      const totalPrice = item.price + customizations.reduce((sum, c) => sum + c.total_modifier, 0);
      onCustomize(customizations, totalPrice * quantity);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTotalPrice = () => {
    const basePrice = item.price;
    const customizationPrice = customizations.reduce((sum, c) => sum + c.total_modifier, 0);
    return (basePrice + customizationPrice) * quantity;
  };

  const getCustomizationSummary = () => {
    return customizations
      .filter(c => c.selected_options.length > 0)
      .map(c => `${c.choice_name}: ${c.selected_options.map(opt => opt.option_name).join(', ')}`)
      .join(' • ');
  };

  if (steps.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{item.name}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{item.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${getTotalPrice().toFixed(2)}</p>
            </div>
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={() => onCustomize([], item.price * quantity)}
          >
            Add to Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = steps[currentStep];
  const currentCustomization = customizations.find(c => c.choice_id === currentStepData?.id);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{item.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>•</span>
          <span>{currentStepData?.name}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{currentStepData?.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{currentStepData?.description}</p>
          
          <div className="space-y-3">
            {currentStepData?.options.map((option) => {
              const isSelected = currentCustomization?.selected_options.some(opt => opt.option_id === option.id) || false;
              const canSelect = currentCustomization ? 
                currentCustomization.selected_options.length < currentStepData.max_selections : true;
              
              return (
                <div
                  key={option.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-green-50 border-green-200' : ''
                  } ${!canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => canSelect && handleOptionSelect(currentStepData.id, option, !isSelected)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => canSelect && handleOptionSelect(currentStepData.id, option, !isSelected)}
                      disabled={!canSelect && !isSelected}
                    />
                    <div>
                      <h4 className="font-medium">{option.name}</h4>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {option.price_modifier > 0 && (
                      <p className="text-sm font-medium text-green-600">+${option.price_modifier.toFixed(2)}</p>
                    )}
                    {option.price_modifier === 0 && (
                      <p className="text-sm text-muted-foreground">Free</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        {currentCustomization && currentCustomization.selected_options.length > 0 && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Selected:</h4>
            <div className="flex flex-wrap gap-2">
              {currentCustomization.selected_options.map((option) => (
                <Badge key={option.option_id} variant="secondary">
                  {option.option_name}
                  {option.price_modifier > 0 && ` (+$${option.price_modifier.toFixed(2)})`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total: ${getTotalPrice().toFixed(2)}</p>
            {getCustomizationSummary() && (
              <p className="text-xs text-muted-foreground max-w-xs truncate">
                {getCustomizationSummary()}
              </p>
            )}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === totalSteps - 1 ? 'Add to Order' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
