/*
 * DreamTime | (C) 2019 by Ivan Bravo Bravo <ivan@dreamnet.tech>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License 3.0 as published by
 * the Free Software Foundation.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import _ from 'lodash'
import swal from 'sweetalert'
import Base from './base'
import platform from '../platform'

export default class extends Base {
  /**
   * Returns if this provider is activated
   */
  can() {
    if (!$nucleus.isEnabled) {
      return false
    }

    if (_.isNil(_.get($nucleus, 'about.checkpoints.name'))) {
      return false
    }

    if (_.isNil(_.get($nucleus, 'about.checkpoints.title'))) {
      return false
    }

    if (_.isNil(_.get($nucleus, 'about.checkpoints.github'))) {
      return false
    }

    if (!platform.requirements.cli) {
      return false
    }

    return true
  }

  /**
   * Returns the code name of the project.
   * It is usually the lowercase name
   */
  getName() {
    return $nucleus.about.checkpoints.name
  }

  /**
   * Returns the current version of the project
   */
  async getCurrentVersion() {
    if (!platform.requirements.checkpoints || !platform.requirements.cli) {
      return 'v0.0.0'
    }

    const filePath = $tools.paths.getCheckpoints('version')

    if (!$tools.fs.exists(filePath)) {
      return 'v0.0.1'
    }

    let version = $tools.fs.read(filePath) || 'v0.0.1'
    version = version.trim()

    return version
  }

  /**
   * Returns the domain and repository of the project in Github.
   * Example: private-dreamnet/dreamtime
   */
  getGithubRepository() {
    return $nucleus.about.checkpoints.github
  }

  /**
   * Download the latest software version
   */
  async download() {
    const filePath = $tools.paths.get('downloads', this.getUpdateFileName())

    if ($tools.fs.exists(filePath)) {
      try {
        // Download completed, now install
        this._setUpdating('Installing...', 0)

        // eslint-disable-next-line no-await-in-loop
        await this.install(filePath)

        return true
      } catch (err) {
        swal({
          icon: 'error',
          title: 'Update failed',
          text: `We tried to install the file located in the Downloads folder but an error has occurred. If this problem persists try to delete the file and download it again.`,
        })

        $rollbar.warn(err, { provider: this })
        console.warn(`Error installing the checkpoints`, err)
      }
    }

    return super.download()
  }

  /**
   * Install the downloaded update
   *
   * @param {string} filePath
   */
  async install(filePath) {
    await $tools.fs.extract(filePath, $tools.paths.getCli())

    this._resetUpdating()

    $tools.utils.api.app.relaunch()
    $tools.utils.api.app.exit()
  }

  /**
   * Send a notification indicating update available
   */
  sendNotification() {
    const notification = new Notification(
      `✨ Checkpoints ${this.latest.tag_name} available!`,
      {
        body: 'A new version of the Checkpoints is available for download.',
      },
    )

    notification.onclick = () => {
      window.$redirect('/system/about')
      $tools.utils.activeWindow().focus()
    }
  }
}
