package com.example.thevoid;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.content.pm.ActivityInfo;
import android.app.Activity;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidInterface");
        
        webView.setWebViewClient(new WebViewClient());
        // Assuming the Vite build output is placed in the Android assets folder
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class WebAppInterface {
        Activity mContext;

        WebAppInterface(Activity c) {
            mContext = c;
        }

        @JavascriptInterface
        public void forceLandscape() {
            mContext.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mContext.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                }
            });
        }

        @JavascriptInterface
        public void forcePortrait() {
            mContext.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mContext.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
                }
            });
        }
        
        @JavascriptInterface
        public void unlockOrientation() {
            mContext.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mContext.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                }
            });
        }
    }
}
