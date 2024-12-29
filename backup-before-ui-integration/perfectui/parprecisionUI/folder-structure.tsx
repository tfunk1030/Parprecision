'use client'

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';

interface FolderStructureProps {
  data: {
    name: string
    type: 'file' | 'folder'
    children?: Array<{
      name: string
      type: 'file' | 'folder'
      children?: Array<any>
    }>
  }
  level?: number
}

interface Structure {
  [key: string]: {
    name: string
    type: 'file' | 'folder'
    children?: Array<{
      name: string
      type: 'file' | 'folder'
      children?: Array<any>
    }>
  }
}

const structure: Structure = {
  src: {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'calculations',
        type: 'folder',
        children: [
          {
            name: 'wind-calculations.js',
            type: 'file',
          },
          {
            name: 'air-density-calculations.js',
            type: 'file',
          },
          {
            name: 'altitude-calculations.js',
            type: 'file',
          },
          {
            name: 'core-calculations.js',
            type: 'file',
          },
        ],
      },
      {
        name: 'components',
        type: 'folder',
        children: [
          {
            name: 'Calculator.tsx',
            type: 'file',
          },
          {
            name: 'WeatherDisplay.tsx',
            type: 'file',
          },
          {
            name: 'ClubSelector.tsx',
            type: 'file',
          },
          {
            name: 'TrajectoryDisplay.tsx',
            type: 'file',
          },
        ],
      },
      {
        name: 'services',
        type: 'folder',
        children: [
          {
            name: 'weather-api.js',
            type: 'file',
          },
          {
            name: 'club-data.js',
            type: 'file',
          },
          {
            name: 'shot-tracker.js',
            type: 'file',
          },
        ],
      },
      {
        name: 'utils',
        type: 'folder',
        children: [
          {
            name: 'validation.js',
            type: 'file',
          },
          {
            name: 'error-handling.js',
            type: 'file',
          },
          {
            name: 'constants.js',
            type: 'file',
          },
        ],
      },
      {
        name: 'models',
        type: 'folder',
        children: [
          {
            name: 'ball-physics.js',
            type: 'file',
          },
          {
            name: 'weather.js',
            type: 'file',
          },
          {
            name: 'club.js',
            type: 'file',
          },
        ],
      },
    ],
  },
  tests: {
    name: 'tests',
    type: 'folder',
    children: [
      {
        name: 'wind.test.js',
        type: 'file',
      },
      {
        name: 'physics.test.js',
        type: 'file',
      },
      {
        name: 'calculations.test.js',
        type: 'file',
      },
      {
        name: 'integration.test.js',
        type: 'file',
      },
    ],
  },
  docs: {
    name: 'docs',
    type: 'folder',
    children: [
      {
        name: 'golf-development-plan.md',
        type: 'file',
      },
      {
        name: 'golf-tech-requirements.md',
        type: 'file',
      },
      {
        name: 'golf-tech-implementation.md',
        type: 'file',
      },
      {
        name: 'development-tasks.md',
        type: 'file',
      },
    ],
  },
  config: {
    name: 'config',
    type: 'folder',
    children: [
      {
        name: 'jest.config.js',
        type: 'file',
      },
      {
        name: 'babel.config.js',
        type: 'file',
      },
      {
        name: 'tsconfig.json',
        type: 'file',
      },
      {
        name: '.eslintrc.json',
        type: 'file',
      },
    ],
  },
};

export function FolderStructure({ data, level = 0 }: FolderStructureProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderItem = (item: any, path: string, level: number) => {
    const isFolder = item.type === 'folder'
    const isExpanded = expandedFolders.has(path)
    const paddingLeft = `${level * 16}px`

    return (
      <div key={path}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer`}
          style={{ paddingLeft }}
          onClick={() => isFolder && toggleFolder(path)}
        >
          {isFolder ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )}
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
            </>
          ) : (
            <>
              <span className="w-4 h-4 mr-1" />
              <File className="w-4 h-4 mr-2 text-gray-500" />
            </>
          )}
          <span className="text-sm">{item.name}</span>
        </div>
        {isFolder && isExpanded && item.children && (
          <div>
            {item.children.map((child: any) =>
              renderItem(child, `${path}/${child.name}`, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-bold text-emerald-400 mb-4">
        Golf Shot Calculator Project Structure
      </h2>
      {renderItem(structure, 'root', level)}
    </div>
  )
}
