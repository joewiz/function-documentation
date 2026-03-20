/* global cy */
/// <reference types="cypress" />

context('Function Documentation', () => {
  beforeEach(() => {
    cy.visit('')
  })

  describe('landing page', () => {
    it('should contain major parts', () => {
      cy.get('.navbar')
        .contains('Home')
      cy.get('h1')
        .contains('Function Documentation')
      cy.get('#fun-query-form')
        .should('exist')
    })
  })

  describe('simple search', () => {
    it('should find article with extended markdown contents and code highlighting', () => {
      cy.get('#query-field')
        .type('file:sync{enter}')
      cy.get('.function-head')
        .should('exist')
        .click()
      cy.url()
        .should('include', 'q=file')
      // code is highlighted
      cy.get('.language-xquery')
        .should('exist')
      // button is visible
      cy.get('.extended-docs')
        .should('exist')
        .click()
      // displays MD 
      cy.get('zero-md')
        .should('exist')
    })
  })

  describe('searching everywhere includes parameter description', () => {
    it('should find file:sync with search term "exist_home"', () => {
      cy.get('#query-field')
        .type('exist_home{enter}')
      cy.get('.function-head')
        .should('exist')
        .click()
      cy.url()
        .should('include', 'q=exist_home')
      // code is highlighted
      cy.get('.language-xquery')
        .should('exist')
      // button is visible
      cy.get('.extended-docs')
        .should('exist')
        .click()
      // displays MD 
      cy.get('zero-md')
        .should('exist')
    })
  })

  describe('Searching for a specific function, map:keys', () => {
    it('should show the correct function signature', () => {
      cy.visit('?q=map%3Akeys').get('.signature')
        .should('have.text', 'map:keys($map as map(*)) as xs:anyAtomicType*')
    })
  })



  describe('browse', () => {
    it('should find local modules', () => {
      cy.get('#browse')
        .click()
      cy.get('.form-inline > .btn')
        .should('be.visible')
      cy.get('[name=appmodules]')
        .check()
      cy.get('.form-inline > .btn')
        .click()
      // check module from fundocs itself
      cy.get('#modules')
        .contains('http://exist-db.org/apps/fundocs/generate')
        .click()
      cy.get('.module')
        .should('exist')
    })
  })

  describe('arity sorting', () => {
    it('should display functions sorted by name then arity', () => {
      cy.visit('?q=map%3Aget&action=search')
      cy.get('.function-head h4').then(($headers) => {
        const texts = [...$headers].map(h => h.textContent.trim())
        // Functions with the same name should be grouped, sorted by arity
        const sorted = [...texts].sort((a, b) => {
          const [nameA, arityA] = a.split('#')
          const [nameB, arityB] = b.split('#')
          return nameA.localeCompare(nameB) || parseInt(arityA) - parseInt(arityB)
        })
        expect(texts).to.deep.equal(sorted)
      })
    })
  })

  describe('deep-linking', () => {
    it('should have anchor links on function headers', () => {
      cy.visit('?q=map%3Akeys&action=search')
      cy.get('.anchor-link')
        .should('exist')
        .first()
        .should('have.attr', 'href')
        .and('match', /^#/)
    })
  })

  describe('deprecated functions', () => {
    it('should have a show deprecated toggle', () => {
      cy.get('#show-deprecated')
        .should('exist')
    })

    it('should hide deprecated functions by default', () => {
      cy.get('#results')
        .should('have.class', 'hide-deprecated')
    })
  })

  describe('search result count', () => {
    it('should show result count after search', () => {
      cy.get('#query-field')
        .type('file:sync{enter}')
      cy.get('#result-count')
        .should('not.be.empty')
    })
  })

  describe('empty search results', () => {
    it('should show empty state message for no results', () => {
      cy.get('#query-field')
        .type('xyznonexistent1234{enter}')
      cy.get('#empty-state')
        .should('exist')
        .and('contain', 'No results found')
    })
  })

  describe('accessibility', () => {
    it('should have a skip-to-content link', () => {
      cy.get('.skip-link')
        .should('exist')
        .and('have.attr', 'href', '#main')
    })

    it('should have aria-labels on form controls', () => {
      cy.get('#query-field')
        .should('have.attr', 'aria-label')
      cy.get('#f-btn-search')
        .should('have.attr', 'aria-label')
    })

    it('should have aria-live on results', () => {
      cy.get('#result-count')
        .should('have.attr', 'aria-live', 'polite')
    })
  })

})
