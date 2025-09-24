import { useEffect } from 'react';

/**
 * Custom hook that triggers a callback when a click is detected outside of the referenced element
 * @param {React.RefObject} ref - Reference to the element to detect outside clicks for
 * @param {Function} handler - Callback function to execute when an outside click is detected
 */
export function useOnClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (event) => {
            // Do nothing if clicking ref's element or descendent elements
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        // Clean up the event listeners when the component unmounts
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

export default useOnClickOutside;
