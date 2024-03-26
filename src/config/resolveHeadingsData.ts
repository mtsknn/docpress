export { resolveHeadingsData }

import { assert, jsxToTextContent } from '../utils/server'
import type {
  HeadingDefinition,
  HeadingDetachedDefinition,
  HeadingResolved,
  HeadingDetachedResolved,
} from '../types/Heading'
import type { Config } from '../types/Config'
import { getConfig } from './getConfig'
import { parseTitle, withEmoji } from '../parseTitle'
import { NavigationData, NavItem } from '../navigation/Navigation'
import type { LinkData } from '../components'
import type { Exports, PageContextOriginal } from './resolvePageContext'
import pc from '@brillout/picocolors'

function resolveHeadingsData(pageContext: PageContextOriginal) {
  const config = getConfig()

  {
    const { headings, headingsDetached } = config
    assertHeadingsDefinition([...headings, ...headingsDetached])
  }

  const resolved = getHeadingsResolved(config)
  const { headingsDetachedResolved } = resolved
  let { headingsResolved } = resolved

  const { activeHeading, isDetachedPage } = getActiveHeading(headingsResolved, headingsDetachedResolved, pageContext)

  const { documentTitle, isLandingPage, pageTitle } = getTitles(activeHeading, pageContext, config)

  const headingsOfCurrentPage = getHeadingsOfTheCurrentPage(pageContext, activeHeading)

  const linksAll: LinkData[] = [
    ...headingsOfCurrentPage.map(pageSectionToLinkData),
    ...headingsResolved.map(headingToLinkData),
    ...headingsDetachedResolved.map(headingToLinkData),
  ]

  let navigationData: NavigationData
  {
    const currentUrl: string = pageContext.urlPathname
    if (isDetachedPage) {
      const navItemsAll: NavItem[] = headingsResolved
      const navItems: NavItem[] = [activeHeading, ...headingsOfCurrentPage].map(headingToNavItem)
      navigationData = {
        isDetachedPage: true,
        navItems,
        navItemsAll,
        currentUrl,
      }
    } else {
      const navItemsAll: NavItem[] = headingsResolved.map(headingToNavItem)
      const activeHeadingIndex = navItemsAll.findIndex((navItem) => navItem.url === currentUrl)
      assert(activeHeadingIndex >= 0)
      headingsOfCurrentPage.forEach((heading, i) => {
        const navItem: NavItem = pageSectionToNavItem(heading)
        navItemsAll.splice(activeHeadingIndex + 1 + i, 0, navItem)
      })

      navigationData = {
        isDetachedPage: false,
        navItems: navItemsAll,
        navItemsAll,
        currentUrl,
      }
    }
  }

  const pageContextAddendum = {
    navigationData,
    linksAll,
    isLandingPage,
    pageTitle,
    documentTitle,
  }
  return pageContextAddendum
}

function headingToNavItem(heading: HeadingResolved | HeadingDetachedResolved): NavItem {
  return {
    level: heading.level,
    url: heading.url,
    title: heading.title,
    titleInNav: heading.titleInNav,
  }
}
function headingToLinkData(heading: HeadingResolved | HeadingDetachedResolved): LinkData {
  return {
    url: heading.url,
    title: heading.title,
    linkBreadcrumb: heading.linkBreadcrumb,
    sectionTitles: heading.sectionTitles,
  }
}
function pageSectionToNavItem(pageSection: HeadingResolved | HeadingDetachedResolved): NavItem {
  return {
    level: pageSection.level,
    url: pageSection.url,
    title: pageSection.title,
    titleInNav: pageSection.titleInNav,
  }
}
function pageSectionToLinkData(pageSection: HeadingResolved | HeadingDetachedResolved): LinkData {
  return {
    url: pageSection.url,
    title: pageSection.title,
    linkBreadcrumb: pageSection.linkBreadcrumb,
    sectionTitles: pageSection.sectionTitles,
  }
}

function getTitles(
  activeHeading: HeadingResolved | HeadingDetachedResolved,
  pageContext: { urlOriginal: string },
  config: Config,
) {
  const url = pageContext.urlOriginal
  const isLandingPage = url === '/'

  const { title } = activeHeading
  let pageTitle = isLandingPage ? null : title
  let documentTitle = activeHeading.titleDocument || jsxToTextContent(title)

  if (!isLandingPage) {
    documentTitle += ' | ' + config.projectInfo.projectName
  }

  if (isLandingPage) {
    pageTitle = null
  }

  return { documentTitle, isLandingPage, pageTitle }
}

function getActiveHeading(
  headingsResolved: HeadingResolved[],
  headingsDetachedResolved: HeadingDetachedResolved[],
  pageContext: { urlOriginal: string; exports: Exports },
) {
  let activeHeading: HeadingResolved | HeadingDetachedResolved | null = null
  const { urlOriginal } = pageContext
  assert(urlOriginal)
  headingsResolved.forEach((heading) => {
    if (heading.url === urlOriginal) {
      activeHeading = heading
      assert(heading.level === 2, { pageUrl: urlOriginal, heading })
    }
  })
  const isDetachedPage = !activeHeading
  if (!activeHeading) {
    activeHeading = headingsDetachedResolved.find(({ url }) => urlOriginal === url) ?? null
  }
  if (!activeHeading) {
    throw new Error(
      [
        `URL ${pc.bold(urlOriginal)} not found in following URLs:`,
        ...headingsResolved
          .map((h) => `  ${h.url}`)
          .filter(Boolean)
          .sort(),
      ].join('\n'),
    )
  }
  return { activeHeading, isDetachedPage }
}

function getHeadingsOfTheCurrentPage(
  pageContext: { exports: Exports; urlOriginal: string },
  currentHeading: HeadingResolved | HeadingDetachedResolved,
) {
  const headingsOfCurrentPage: HeadingResolved[] = []

  const pageSections = pageContext.exports.pageSectionsExport ?? []

  pageSections.forEach((pageSection) => {
    const pageSectionTitleJsx = parseTitle(pageSection.pageSectionTitle)
    const url: null | string = pageSection.pageSectionId === null ? null : '#' + pageSection.pageSectionId
    if (pageSection.pageSectionLevel === 2) {
      const heading: HeadingResolved = {
        url,
        title: pageSectionTitleJsx,
        linkBreadcrumb: [currentHeading.title, ...(currentHeading.linkBreadcrumb ?? [])],
        titleInNav: pageSectionTitleJsx,
        level: 3,
      }
      headingsOfCurrentPage.push(heading)
    }
  })

  if (currentHeading?.sectionTitles) {
    currentHeading.sectionTitles.forEach((sectionTitle) => {
      const pageSectionTitles = pageSections.map((h) => h.pageSectionTitle)
      assert(pageSectionTitles.includes(sectionTitle), { pageHeadingTitles: pageSectionTitles, sectionTitle })
    })
  }

  return headingsOfCurrentPage
}

/**
 * - Parse title (from `string` to `JSX.Element`)
 * - Determine navigation breadcrumbs
 */
function getHeadingsResolved(config: {
  headings: HeadingDefinition[]
  headingsDetached: HeadingDetachedDefinition[]
}): {
  headingsResolved: HeadingResolved[]
  headingsDetachedResolved: HeadingDetachedResolved[]
} {
  const headingsWithoutBreadcrumb: Omit<HeadingResolved, 'linkBreadcrumb'>[] = config.headings.map(
    (heading: HeadingDefinition) => {
      const titleParsed: JSX.Element = parseTitle(heading.title)

      const titleInNav = heading.titleInNav || heading.title
      let titleInNavParsed: JSX.Element
      titleInNavParsed = parseTitle(titleInNav)
      if ('titleEmoji' in heading) {
        assert(heading.titleEmoji)
        titleInNavParsed = withEmoji(heading.titleEmoji, titleInNavParsed)
      }

      const headingResolved: Omit<HeadingResolved, 'linkBreadcrumb'> = {
        ...heading,
        title: titleParsed,
        titleInNav: titleInNavParsed,
      }
      return headingResolved
    },
  )

  const headingsResolved: HeadingResolved[] = []
  headingsWithoutBreadcrumb.forEach((heading) => {
    const linkBreadcrumb = getHeadingsBreadcrumb(heading, headingsResolved)
    headingsResolved.push({
      ...heading,
      linkBreadcrumb,
    })
  })

  const headingsDetachedResolved = config.headingsDetached.map((headingsDetached) => {
    const { url, title } = headingsDetached
    assert(
      headingsResolved.find((heading) => heading.url === url) === undefined,
      `remove ${headingsDetached.url} from headingsDetached`,
    )
    const titleParsed = typeof title === 'string' ? parseTitle(title) : title
    return {
      ...headingsDetached,
      level: 2 as const,
      title: titleParsed,
      titleInNav: titleParsed,
      linkBreadcrumb: null,
    }
  })

  return { headingsResolved, headingsDetachedResolved }
}

function getHeadingsBreadcrumb(heading: Omit<HeadingResolved, 'linkBreadcrumb'>, headings: HeadingResolved[]) {
  const linkBreadcrumb: JSX.Element[] = []
  let levelCurrent = heading.level
  headings
    .slice()
    .reverse()
    .forEach((parentCandidate) => {
      const isParent = parentCandidate.level < levelCurrent
      if (isParent) {
        levelCurrent = parentCandidate.level
        linkBreadcrumb.push(parentCandidate.title)
      }
    })
  return linkBreadcrumb
}

function assertHeadingsDefinition(headings: { url?: null | string }[]) {
  headings.forEach((heading) => {
    if (heading.url) {
      const { url } = heading
      assert(url.startsWith('/'))
    }
  })
}
