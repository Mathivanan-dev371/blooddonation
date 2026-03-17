// src/utils/notificationUtils.js
import { supabase } from '../lib/supabase'; // Update this path to your supabase client file

/**
 * Sends a notification to a specific user by their UUID.
 */
export const handleNotify = async (targetUserId, title, body) => {
    console.log("Sending notification request for user:", targetUserId);

    // Check if the website is being viewed inside the Mobile App WebView
    if (window.ReactNativeWebView) {
        // Communication via the Bridge we built in the Expo app
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SEND_NOTIFICATION',
            userId: targetUserId,
            title: title,
            body: body
        }));
        return { success: true, method: 'webview-bridge' };
    } else {
        // Normal browser behavior: Call the Supabase RPC directly
        const { data, error } = await supabase.rpc('notify_user_by_id', {
            target_user_id: targetUserId,
            title: title,
            body: body
        });

        if (error) throw error;
        return data;
    }
};

/**
 * Sends a notification to EVERY registered user.
 */
export const handleNotifyAll = async (title, body) => {
    console.log("Initiating global broadcast...");

    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'BROADCAST_NOTIFICATION',
            title: title,
            body: body
        }));
        return { success: true, method: 'webview-bridge' };
    } else {
        const { data, error } = await supabase.rpc('notify_all_users', {
            title: title,
            body: body
        });

        if (error) throw error;
        return data;
    }
};