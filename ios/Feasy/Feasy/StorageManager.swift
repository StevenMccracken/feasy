//
//  Storage.swift
//  Feasy
//
//  Created by Steven McCracken on 9/17/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import Foundation

class StorageManager {
    
    static func get(key: String) -> Any? {
        return UserDefaults.standard.value(forKey: key)
    }
    
    static func set(key: String, value: Any) {
        UserDefaults.standard.set(value, forKey: key)
    }
}
