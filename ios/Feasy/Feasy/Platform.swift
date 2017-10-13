//
//  Platform.swift
//  Feasy
//
//  Created by Steven McCracken on 10/13/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import Foundation

struct Platform {
  static let isSimulator: Bool = {
    var isSim = false
    #if arch(i386) || arch(x86_64)
      isSim = true
    #endif
    return isSim
  }()
}
