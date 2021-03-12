'use strict';

// Helper functions
// Get Data from url
async function getData(url) {
  const response = await fetch(url);
  const data = await response.json();

  return data;
}

// Debounce function
function debounce(func, wait = 1000) {
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  let timerId;

  return (...args) => {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
}

const URL = 'https://restcountries.eu/rest/v2';
const language = window.navigator.userLanguage || window.navigator.language;
const initialSettings = {
  loading: true,
  searchQuery: '',
  region: '',
  countries: [],
};

let state = JSON.parse(localStorage.getItem('state')) || initialSettings;

window.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const btnToggleMode = document.querySelector('#toggle-mode');
  const btnBack = document.querySelector('#back');
  const inputSearch = document.querySelector('#search');
  const filterByRegion = document.querySelector('#filter-by-region');
  const filterByRegionLabel = filterByRegion.querySelector('span.text');
  const toolsContainer = document.querySelector('.tools .container');
  const contentContainer = document.querySelector('.content .container');

  // get countries object from SESSION storage
  let countries = JSON.parse(sessionStorage.getItem('countries'));

  // if state.loading or countries not exist in session storage
  // get data from API and set to SESSION storage
  if (state.loading || !countries) {
    getData(URL + '/all').then(data => {
      countries = data;
      sessionStorage.setItem('countries', JSON.stringify(data));
      updateState({ loading: false });
    });
  } else {
    updateState();
  }

  function updateState(data = {}) {
    state = Object.assign(state, data);

    const filteredByRegion = !!state.region
      ? countries.filter(country => country.region === state.region)
      : countries;

    state.countries = state.searchQuery
      ? (state.countries = filteredByRegion.filter(country =>
          country.name.toLowerCase().includes(state.searchQuery)
        ))
      : (state.countries = filteredByRegion);

    localStorage.setItem('state', JSON.stringify(state));

    renderCountries();
  }

  function renderCountries() {
    renderSearch();
    renderFilterByRegion();
    renderCountriesList();
  }

  function renderSearch() {
    inputSearch.value = state.searchQuery;
  }

  function renderFilterByRegion() {
    filterByRegionLabel.textContent = state.region || 'Filer by Region';
  }

  function renderCountriesList({ countries } = state) {
    contentContainer.innerHTML = '';

    if (!countries.length) {
      contentContainer.insertAdjacentHTML('afterbegin', '<p>no data</p>');
      return;
    }

    contentContainer.insertAdjacentHTML(
      'afterbegin',
      countries
        .map(country => {
          const {
            flag,
            name,
            alpha3Code,
            population,
            region,
            capital,
          } = country;
          return `
                <a href="#${alpha3Code}" class="countries__item" data-link">
                    <div class="card">
                        <div class="card__image">
                            <img src="${flag}" loading="lazy" alt="Flag of ${name}">
                        </div>
                        <div class="card__content">
                            <h3 class="card__title">${name}</h3>
                            <ul class="card__info-list">
                                <li>Population: <span>${new Intl.NumberFormat(
                                  language
                                ).format(population)}</span></li>
                                <li>Region: <span>${region}</span></li>
                                <li>Capital: <span>${capital}</span></li>
                            </ul>
                        </div>
                    </div>
                </a>
                `;
        })
        .join('')
    );
  }

  function setToInitialState() {
    updateState(initialSettings);
    inputSearch.value = '';
    filterByRegionLabel.textContent = 'Filter by Region';
  }

  // EVENTS
  // Event click toggle button
  btnToggleMode.addEventListener('click', () => {
    const label = btnToggleMode.querySelector('.btn-toggle__text');
    document.body.classList.toggle('is-dark');

    label.textContent = document.body.classList.contains('is-dark')
      ? 'Light mode'
      : 'Dark mode';
  });

  btnBack.addEventListener('click', e => {
    e.preventDefault();
    window.history.back();
  });
  // Event input search query
  inputSearch.addEventListener(
    'input',
    debounce(e => {
      const searchQuery = e.target.value.toLowerCase();

      updateState({ searchQuery });
    }, 500)
  );

  // Event body click
  document.body.addEventListener('click', e => {
    // Clicking on filter by region
    if (e.target.hasAttribute('data-region')) {
      e.preventDefault();
      const region = e.target.dataset.region;

      updateState({ searchQuery: '', region });
    }

    // Clicking on an item data-link
    if (e.target.hasAttribute('data-link')) {
      e.preventDefault();
      setToInitialState();
      document.body.classList.remove('country');
      navigateTo(e.target.href);
    }
  });

  const navigateTo = url => {
    history.pushState(null, null, url);
  };

  //   window.addEventListener('popstate', e => {
  //     console.log('location: ' + document.location);
  //   });

  window.addEventListener('hashchange', e => {
    console.log(location.hash);
    if (location.hash === '') {
      document.body.classList.remove('country');
      renderCountries();
      return;
    }

    document.body.classList.add('country');

    renderCountry(location.hash.substring(1));
  });

  function getName(alpha3Code) {
    return countries.find(country => country.alpha3Code === alpha3Code).name;
  }

  function renderCountry(code) {
    contentContainer.innerHTML = '';

    const {
      flag,
      name,
      nativeName,
      population,
      region,
      subregion,
      capital,
      topLevelDomain,
      currencies,
      languages,
      borders,
    } = countries.find(country => country.alpha3Code === code);

    const html = `
        <div class="country">
            <div class="country__flag">
                <img src="${flag}" alt="Flag of ${name}">
            </div>
            <div class="country__info">
                <h2 class="country__title">${name}</h2>
                <div class="country__info__details">
                    <dl>
                        <div>
                            <dt>Native name:</dt>
                            <dd>${nativeName}</dd>
                        </div>
                        <div>
                            <dt>Population:</dt>
                            <dd>${new Intl.NumberFormat(language).format(
                              population
                            )}</dd>
                        </div>
                        <div>
                            <dt>Region:</dt>
                            <dd>${region}</dd>
                        </div>
                        <div>
                            <dt>Sub Region:</dt>
                            <dd>${subregion}</dd>
                        </div>
                        <div>
                            <dt>Capital:</dt>
                            <dd>${capital}</dd>
                        </div>
                    </dl>
                    <dl>
                        <div>
                            <dt>Top level Domain:</dt>
                            <dd>${topLevelDomain}</dd>
                        </div>
                        <div>
                            <dt>Currencies:</dt>
                            <dd>${currencies
                              .map(curr => curr.name + ` (${curr.symbol})`)
                              .join(', ')}</dd>
                        </div>
                        <div>
                            <dt>Languages:</dt>
                            <dd>${languages
                              .map(lang => lang.name)
                              .join(', ')}</dd> 
                        </div>
                    </dl>
                </div>

                <div class="country__borders">
                    <h3>Border Countries:</h3>
                    <div>
                        ${borders
                          .map(
                            border =>
                              `<a href="#${border}" class="btn btn--sm">${getName(
                                border
                              )}</a>`
                          )
                          .join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    contentContainer.insertAdjacentHTML('afterbegin', html);
  }
});
