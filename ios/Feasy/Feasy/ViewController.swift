//
//  ViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 9/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit

class ViewController: UIViewController {
    
    let userService = UserService()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

        userService.login() { response, json in
            print(json)
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}

