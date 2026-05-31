from app.jobs.source_enricher import _strip_html


def test_strip_html_removes_nav_header_footer_and_scripts() -> None:
    html = """
    <html>
      <head><style>.x { color: red; }</style></head>
      <body>
        <header>Company Header</header>
        <nav class="main-menu">Home Jobs About</nav>
        <main>
          <h1>Backend Engineer</h1>
          <p>Build APIs with Python and FastAPI.</p>
        </main>
        <aside>Related jobs</aside>
        <footer id="site-footer">Copyright 2026</footer>
        <script>console.log("noise");</script>
      </body>
    </html>
    """

    text = _strip_html(html)

    assert "Backend Engineer" in text
    assert "Build APIs with Python and FastAPI." in text
    assert "Company Header" not in text
    assert "Home Jobs About" not in text
    assert "Related jobs" not in text
    assert "Copyright 2026" not in text
    assert "console.log" not in text


def test_strip_html_removes_elements_with_noisy_class_or_id() -> None:
    html = """
    <html>
      <body>
        <div id="top-navigation">Skip this</div>
        <div class="sidebar-menu">Menu item</div>
        <article>
          <p>We need strong experience with PostgreSQL and Docker.</p>
        </article>
        <div class="page-footer-links">Privacy Terms</div>
      </body>
    </html>
    """

    text = _strip_html(html)

    assert "PostgreSQL and Docker" in text
    assert "Skip this" not in text
    assert "Menu item" not in text
    assert "Privacy Terms" not in text


def test_strip_html_uses_space_separator_not_one_word_per_line() -> None:
    html = """
    <html><body>
      <div><span>Python</span><span>FastAPI</span><span>PostgreSQL</span></div>
      <p>Remote</p><p>full-time</p>
    </body></html>
    """

    text = _strip_html(html)

    assert text == "Python FastAPI PostgreSQL Remote full-time"
    assert "\n" not in text
