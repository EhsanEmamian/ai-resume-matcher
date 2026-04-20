def parse_resume_with_mock(raw_text: str) -> dict:
    text = raw_text.lower()

    technologies: list[str] = []
    skills: list[str] = []
    languages: list[str] = []
    suggested_roles: list[str] = []

    tech_keywords = {
        "python": "Python",
        "java": "Java",
        "sql": "SQL",
        "php": "PHP",
        "javascript": "JavaScript",
        "vue": "Vue.js",
        "html": "HTML",
        "css": "CSS",
        "ajax": "AJAX",
        "git": "Git",
        "rest": "REST APIs",
        "datenbank": "Relational Databases",
        "database": "Relational Databases",
    }

    skill_keywords = {
        "backend": "Backend Development",
        "softwareentwicklung": "Software Development",
        "software development": "Software Development",
        "webentwicklung": "Web Development",
        "web development": "Web Development",
        "datenbank": "Database Development",
        "database": "Database Development",
        "client-server": "Client-Server Systems",
        "api": "API Development",
    }

    language_keywords = {
        "deutsch": "German",
        "german": "German",
        "englisch": "English",
        "english": "English",
        "persisch": "Persian",
        "persian": "Persian",
    }

    role_keywords = {
        "backend": "Junior Backend Developer",
        "softwareentwickler": "Junior Software Developer",
        "software developer": "Junior Software Developer",
        "web": "Junior Web Developer",
        "vue": "Junior Frontend Developer",
        "python": "Junior Python Developer",
    }

    for keyword, value in tech_keywords.items():
        if keyword in text and value not in technologies:
            technologies.append(value)

    for keyword, value in skill_keywords.items():
        if keyword in text and value not in skills:
            skills.append(value)

    for keyword, value in language_keywords.items():
        if keyword in text and value not in languages:
            languages.append(value)

    for keyword, value in role_keywords.items():
        if keyword in text and value not in suggested_roles:
            suggested_roles.append(value)

    if not skills:
        skills = ["Software Development"]

    if not technologies:
        technologies = ["Python", "SQL"]

    if not languages:
        languages = ["English"]

    if not suggested_roles:
        suggested_roles = ["Junior Software Developer"]

    return {
        "skills": skills,
        "technologies": technologies,
        "languages": languages,
        "years_of_experience": None,
        "seniority_level": "junior",
        "suggested_roles": suggested_roles,
    }