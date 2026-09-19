package com.biblestages.app;

import android.annotation.SuppressLint;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
  private static final String PREFS = "bible-stages";
  private static final String KEY_URL = "hall-url";

  private WebView web;
  private View setup;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.parseColor("#243F3C"));
    setContentView(R.layout.activity_main);

    setup = findViewById(R.id.setupRoot);
    web = findViewById(R.id.hallView);
    configureWebView();

    EditText field = findViewById(R.id.hallUrl);
    Button open = findViewById(R.id.openHall);
    String saved = prefs().getString(KEY_URL, "");
    if (saved != null && !saved.isEmpty()) {
      field.setText(saved);
      openHall(saved);
    }

    open.setOnClickListener(v -> openHall(field.getText().toString()));
    field.setOnEditorActionListener(
        (v, actionId, event) -> {
          if (actionId == EditorInfo.IME_ACTION_DONE || actionId == EditorInfo.IME_ACTION_GO) {
            openHall(field.getText().toString());
            return true;
          }
          return false;
        });
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
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(
        new WebViewClient() {
          @Override
          public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return false;
          }
        });
  }

  private void openHall(String raw) {
    String url = normalize(raw);
    if (url == null) {
      Toast.makeText(this, "Paste the class hall address first.", Toast.LENGTH_SHORT).show();
      showSetup();
      return;
    }
    prefs().edit().putString(KEY_URL, url).apply();
    setup.setVisibility(View.GONE);
    web.setVisibility(View.VISIBLE);
    web.loadUrl(url);
  }

  private void showSetup() {
    web.setVisibility(View.GONE);
    setup.setVisibility(View.VISIBLE);
  }

  private String normalize(String raw) {
    if (raw == null) return null;
    String url = raw.trim();
    if (url.isEmpty()) return null;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    if (!url.startsWith("https://")) return null;
    return url;
  }

  private SharedPreferences prefs() {
    return getSharedPreferences(PREFS, MODE_PRIVATE);
  }

  @Override
  public void onBackPressed() {
    if (web.getVisibility() == View.VISIBLE && web.canGoBack()) {
      web.goBack();
      return;
    }
    if (web.getVisibility() == View.VISIBLE) {
      showSetup();
      return;
    }
    super.onBackPressed();
  }
}
