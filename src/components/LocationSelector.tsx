'use client'

import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, BuildingStorefrontIcon } from '@heroicons/react/20/solid'
import type { Location } from '../lib/supabase-types-mvp'

interface LocationSelectorProps {
  locations: Location[]
  selectedLocation: Location | null
  onLocationChange: (location: Location | null) => void
  placeholder?: string
  includeAllOption?: boolean
  className?: string
  disabled?: boolean
}

export default function LocationSelector({
  locations,
  selectedLocation,
  onLocationChange,
  placeholder = "Select location",
  includeAllOption = true,
  className = '',
  disabled = false
}: LocationSelectorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left text-sm text-gray-500">
          Loading locations...
        </div>
      </div>
    )
  }

  // Create options array
  const options = [
    ...(includeAllOption ? [{ id: 'all', name: 'All Locations', isAllOption: true }] : []),
    ...locations.map(location => ({ ...location, isAllOption: false }))
  ]

  const getSelectedOption = () => {
    if (!selectedLocation) {
      return includeAllOption ? options[0] : null
    }
    return options.find(option => option.id === selectedLocation.id) || null
  }

  const handleChange = (option: any) => {
    if (option.isAllOption) {
      onLocationChange(null)
    } else {
      onLocationChange(option as Location)
    }
  }

  const selectedOption = getSelectedOption()

  return (
    <div className={`relative ${className}`}>
      <Listbox value={selectedOption} onChange={handleChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button className={`relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:text-sm ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}>
            <span className="flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2" />
              {selectedOption ? (
                <span className="block truncate">
                  {selectedOption.isAllOption ? selectedOption.name : `${selectedOption.name}`}
                </span>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.length === 0 ? (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  No locations available
                </div>
              ) : (
                options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-purple-100 text-purple-900' : 'text-gray-900'
                      }`
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <BuildingStorefrontIcon 
                            className={`h-4 w-4 mr-2 ${
                              option.isAllOption ? 'text-gray-400' :
                              selected ? 'text-purple-600' : 'text-gray-400'
                            }`} 
                          />
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.name}
                          </span>
                          {!option.isAllOption && 'is_primary' in option && option.is_primary && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Primary
                            </span>
                          )}
                        </div>

                        {selected ? (
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-white' : 'text-purple-600'
                          }`}>
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}

                        {!option.isAllOption && 'city' in option && 'state' in option && (
                          <div className="text-xs text-gray-500 ml-6 mt-1">
                            {option.city}, {option.state}
                          </div>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}