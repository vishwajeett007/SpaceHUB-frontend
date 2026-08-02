import { createElement, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import RouteLoadingFallback from './RouteLoadingFallback'
import { appRoutes } from './routeConfig'

function createRouteElement({ Guard, Page }) {
  const page = createElement(Page)

  return Guard ? createElement(Guard, null, page) : page
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {appRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={createRouteElement(route)}
          />
        ))}
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
