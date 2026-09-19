package com.biblestages.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
  private WebView web;
  private AssetServer server;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.parseColor("#243F3C"));
    setContentView(R.layout.activity_main);
    web = findViewById(R.id.hallView);
    configureWebView();
    try {
      server = new AssetServer(this);
      server.start();
      web.loadUrl(server.origin() + "/");
    } catch (Exception e) {
      Toast.makeText(this, "Bible Stages could not start on this phone.", Toast.LENGTH_LONG).show();
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private void configureWebView() {
    WebSettings settings = web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setLoadWithOverviewMode(true);
    settings.setUseWideViewPort(true);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setAllowFileAccess(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    web.setBackgroundColor(Color.parseColor("#243F3C"));
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(
        new WebViewClient() {
          @Override
          public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return false;
          }
        });
  }

  private void tellHall(String fn) {
    if (web == null) return;
    web.evaluateJavascript(
        "(function(){try{if(window." + fn + ")window." + fn + "();}catch(e){}})()", null);
  }

  @Override
  protected void onPause() {
    tellHall("__bibleStagesAppHidden");
    super.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    tellHall("__bibleStagesAppShown");
  }

  @Override
  public void onBackPressed() {
    if (web != null && web.canGoBack()) {
      web.goBack();
      return;
    }
    super.onBackPressed();
  }

  @Override
  protected void onDestroy() {
    if (server != null) server.stop();
    super.onDestroy();
  }
}
