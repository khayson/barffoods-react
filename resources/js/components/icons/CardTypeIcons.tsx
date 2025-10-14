/**
 * 🎨 FIGMA REFERENCE
 * URL: https://www.figma.com/design/jmWnnfdCipxqiQF39Tdb0S/IQRAQUEST?node-id=542-68353&t=O1w7ozri9pYud8IO-0
 * Export: Card type icons for payment interface
 * 
 * EXACT SPECS FROM FIGMA:
 * - Mastercard, Visa, and Apple Pay logos
 * - Proper sizing and positioning for payment form
 * - Consistent styling across all card types
 */
import React from 'react';
import { VisaCardIcon } from './visa-card-icon';
import { MasterCardIcon } from './master-card-icon';
import { ApplePayIcon } from './apple-pay-icon';

interface CardTypeIconsProps {
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

export function CardTypeIcons({ className = '', size = 'medium' }: CardTypeIconsProps) {
    const sizeClasses = {
        small: 'w-6 h-4',
        medium: 'w-8 h-5',
        large: 'w-10 h-6'
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <VisaCardIcon className={`${sizeClasses[size]} object-contain`} />
            <MasterCardIcon className={`${sizeClasses[size]} object-contain`} />
            <ApplePayIcon className={`${sizeClasses[size]} object-contain`} />
        </div>
    );
}

interface SingleCardIconProps {
    type: 'visa' | 'mastercard' | 'applepay';
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

export function SingleCardIcon({ type, className = '', size = 'small' }: SingleCardIconProps) {
    const sizeClasses = {
        small: 'w-6 h-4',
        medium: 'w-8 h-5',
        large: 'w-10 h-6'
    };

    const iconClass = `${sizeClasses[size]} object-contain ${className}`;

    switch (type) {
        case 'visa':
            return <VisaCardIcon className={iconClass} />;
        case 'mastercard':
            return <MasterCardIcon className={iconClass} />;
        case 'applepay':
            return <ApplePayIcon className={iconClass} />;
        default:
            return null;
    }
}
