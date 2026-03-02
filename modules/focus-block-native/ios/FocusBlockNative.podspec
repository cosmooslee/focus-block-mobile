Pod::Spec.new do |s|
  s.name           = 'FocusBlockNative'
  s.version        = '1.0.0'
  s.summary        = 'Screen Time API blocking for Focus Block'
  s.description    = 'iOS native module using FamilyControls and ManagedSettings for app/website blocking'
  s.author         = 'Focus Block'
  s.homepage       = 'https://github.com/focusblock'
  s.license        = { type: 'MIT' }
  s.source         = { git: '' }

  s.platform       = :ios, '16.0'
  s.swift_version  = '5.9'
  s.source_files   = '**/*.swift'

  s.dependency 'ExpoModulesCore'

  s.frameworks = 'FamilyControls', 'ManagedSettings', 'DeviceActivity'
end
