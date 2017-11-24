//
//  MainViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 11/16/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit

class MainViewController: UIViewController {
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    // Do any additional setup after loading the view.
  }
  
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    
    if !LoginManager.isUserLoggedIn() {
      let loginStoryboard = UIStoryboard(name: "LoginViewStoryboard", bundle: nil)
      let loginNavigationController = loginStoryboard.instantiateInitialViewController() as! UINavigationController
      
      present(loginNavigationController, animated: true)
    }
  }
  
  override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Dispose of any resources that can be recreated.
  }
  
  
  /*
  // MARK: - Navigation
   
  // In a storyboard-based application, you will often want to do a little preparation before navigation
  override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
      // Get the new view controller using segue.destinationViewController.
      // Pass the selected object to the new view controller.
  }
  */
  
}
