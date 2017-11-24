//
//  LaunchViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 9/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit
import SwiftyJSON

class LaunchViewController: UINavigationController {
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    let tokenAlreadyExists = UserService.refreshToken(success: { [weak self] (result: JSON) in
      print(result)
      guard let strongSelf = self else { return }
      print("helloooo")
      strongSelf.presentHomeView()
    }, error: { [weak self] (error: HTTPURLResponse) in
      print("fuck")
    })
    
    if !tokenAlreadyExists {
      presentHomeView()
    }
  }
  
  private func presentHomeView() {
    let homeStoryboard = UIStoryboard(name: "Home", bundle: nil)
    let homeNavigationController = homeStoryboard.instantiateInitialViewController() as! UINavigationController
    pushViewController(homeNavigationController, animated: true)
  }
  
  override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Dispose of any resources that can be recreated.
  }
}
