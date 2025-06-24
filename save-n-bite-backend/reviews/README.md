### Testing

# Run all tests in the reviews app
poetry run python manage.py test reviews

# Or using pytest (recommended based on your setup)
poetry run pytest reviews/tests/

# Run the specific extended tests file
poetry run pytest reviews/tests/test_extended_reviews.py

# More detailed output
poetry run pytest reviews/tests/ -v

# Very verbose with test names
poetry run pytest reviews/tests/ -vv

# Generate coverage report (your pyproject.toml is already configured for this)
poetry run pytest reviews/tests/ --cov=reviews

# Coverage for entire project
poetry run pytest --cov=.

# Coverage with missing lines shown
poetry run pytest reviews/tests/ --cov=reviews --cov-report=term-missing