import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Button } from './button';
import { Smile } from 'lucide-react';

interface EmojiPickerComponentProps {
    value?: string;
    onEmojiSelect: (emoji: string) => void;
    buttonText?: string;
    buttonClassName?: string;
}

export const EmojiPickerComponent: React.FC<EmojiPickerComponentProps> = ({
    value,
    onEmojiSelect,
    buttonText = 'Select Emoji',
    buttonClassName = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        
        checkDarkMode();
        
        // Watch for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        return () => observer.disconnect();
    }, []);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onEmojiSelect(emojiData.emoji);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={pickerRef}>
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClassName}
            >
                {value ? (
                    <span className="text-2xl mr-2">{value}</span>
                ) : (
                    <Smile className="h-4 w-4 mr-2" />
                )}
                {buttonText}
            </Button>

            {isOpen && (
                <div className="absolute z-50 mt-2 left-0">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                        width={350}
                        height={400}
                        searchPlaceHolder="Search emojis..."
                        previewConfig={{
                            showPreview: true
                        }}
                    />
                </div>
            )}
        </div>
    );
};

