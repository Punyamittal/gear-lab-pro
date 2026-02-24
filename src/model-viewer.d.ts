import * as React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                src?: string;
                alt?: string;
                'auto-rotate'?: boolean;
                'rotation-per-second'?: string;
                'camera-controls'?: boolean;
                'shadow-intensity'?: string;
                'shadow-softness'?: string;
                'environment-image'?: string;
                exposure?: string;
                'camera-orbit'?: string;
                'min-camera-orbit'?: string;
                'max-camera-orbit'?: string;
                'field-of-view'?: string;
                loading?: string;
                bounds?: string;
                'interpolation-decay'?: string;
            }, HTMLElement>;
        }
    }
}
